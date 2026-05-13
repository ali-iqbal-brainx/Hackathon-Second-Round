import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Types } from 'mongoose';
import { TicketsService } from '../tickets/tickets.service.js';
import {
  TicketPriority,
  TicketType,
} from '../tickets/entities/ticket.entity.js';
import type { TicketCreateInput } from '../tickets/tickets.repository.js';
import { BriefRepository } from './brief.repository.js';
import { BriefTextExtractionService } from './brief-text-extraction.service.js';
import { BriefStatus } from './entities/brief.entity.js';
import type { BriefDocument } from './entities/brief.entity.js';
import type { TicketDocument } from '../tickets/entities/ticket.entity.js';

const AMBIGUITY_SYSTEM = `You are a senior product analyst. Your job is to read a client brief and list EVERY ambiguous, unclear, missing, or contradictory point as a separate clarifying question.

Rules:
- Never assume or invent facts that are not explicitly stated in the brief.
- If something could be interpreted multiple ways, ask about it.
- If critical information for development is missing (scope, users, platforms, integrations, deadlines, constraints, success criteria, etc.), ask about it.
- Output MUST be a single JSON object with exactly one key: "questions", whose value is an array of strings.
- Each question must be a single clear sentence.
- If the brief is fully clear (rare), return an empty array for "questions".`;

const TICKETS_SYSTEM = `You are an expert technical PM. Given a client brief, optional clarifying questions, and the PMO team's answers, produce developer-ready Jira-style work items.

Rules:
- Output MUST be a single JSON object with one key: "tickets", whose value is an array of objects.
- Each ticket object MUST have: "title" (string), "description" (string), "acceptanceCriteria" (array of strings), "priority" (exactly one of: "High", "Medium", "Low"), "type" (exactly one of: "Frontend", "Backend", "Design").
- Descriptions should be actionable for engineers (context, user flow, technical notes when inferable from the brief and answers).
- Acceptance criteria must be testable bullet points.
- Split work sensibly; prefer multiple focused tickets over one vague ticket.`;

function parseJsonFromModelContent<T>(raw: string): T {
  let s = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(s);
  if (fence) {
    s = fence[1].trim();
  }
  return JSON.parse(s) as T;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

@Injectable()
export class BriefService {
  constructor(
    private readonly briefRepository: BriefRepository,
    private readonly ticketsService: TicketsService,
    private readonly textExtraction: BriefTextExtractionService,
    private readonly openai: OpenAI,
    private readonly configService: ConfigService,
  ) {}

  async upload(
    files: Express.Multer.File[],
  ): Promise<{ briefId: string; clarifyingQuestions: string[] }> {
    if (!files?.length) {
      throw new BadRequestException('At least one file is required.');
    }

    console.log(
      `[Brief] upload received: ${files.length} file(s):`,
      files.map((f) => f.originalname),
    );

    const { originalText, fileNames } =
      await this.textExtraction.extractFromFiles(files);

    console.log(
      `[Brief] combined extracted text length: ${originalText.length}`,
    );

    const clarifyingQuestions =
      await this.generateClarifyingQuestions(originalText);

    console.log(
      `[Brief] ambiguity detection produced ${clarifyingQuestions.length} question(s)`,
    );

    const brief = await this.briefRepository.create({
      originalText,
      fileNames,
      clarifyingQuestions,
      userAnswers: [],
      status: BriefStatus.PendingAnswers,
    });

    const briefId = brief._id.toHexString();
    return { briefId, clarifyingQuestions };
  }

  async submitAnswers(
    briefId: Types.ObjectId,
    answers: string[],
  ): Promise<{ tickets: Record<string, unknown>[] }> {
    const brief = await this.briefRepository.findById(briefId);
    if (!brief) {
      throw new NotFoundException('Brief not found.');
    }

    if (brief.status === BriefStatus.Completed) {
      throw new BadRequestException(
        'This brief is already completed; tickets cannot be regenerated.',
      );
    }

    if (brief.status === BriefStatus.Generating) {
      throw new BadRequestException(
        'Ticket generation is already in progress for this brief.',
      );
    }

    if (brief.status !== BriefStatus.PendingAnswers) {
      throw new BadRequestException('This brief is not waiting for answers.');
    }

    if (answers.length !== brief.clarifyingQuestions.length) {
      throw new BadRequestException(
        `Expected ${brief.clarifyingQuestions.length} answer(s) (one per clarifying question), got ${answers.length}.`,
      );
    }

    console.log(
      `[Brief] answers submitted for ${briefId.toHexString()}: ${answers.length} answer(s)`,
    );

    await this.briefRepository.updateById(briefId, {
      userAnswers: answers,
      status: BriefStatus.Generating,
    });

    try {
      console.log(
        `[Brief] starting ticket generation for ${briefId.toHexString()}`,
      );
      const ticketInputs = await this.generateTicketPayloads(
        brief.originalText,
        brief.clarifyingQuestions,
        answers,
      );

      await this.ticketsService.deleteByBriefId(briefId);
      const saved = await this.ticketsService.insertManyForBrief(
        briefId,
        ticketInputs,
      );

      await this.briefRepository.updateById(briefId, {
        status: BriefStatus.Completed,
      });

      console.log(
        `[Brief] ticket generation finished for ${briefId.toHexString()}: ${saved.length} ticket(s) saved`,
      );

      return {
        tickets: saved.map((t) => this.serializeTicket(t)),
      };
    } catch (err) {
      console.error('[Brief] ticket generation failed', err);
      await this.ticketsService.deleteByBriefId(briefId);
      await this.briefRepository.updateById(briefId, {
        status: BriefStatus.PendingAnswers,
      });
      if (
        err instanceof BadGatewayException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }
      throw new BadGatewayException(
        'Ticket generation failed. Please try again in a moment.',
      );
    }
  }

  async getHistory(): Promise<
    {
      briefId: string;
      fileNames: string[];
      createdAt: Date;
      status: BriefStatus;
      tickets: Record<string, unknown>[];
    }[]
  > {
    const briefs = await this.briefRepository.findAllSortedByCreatedDesc();
    const ids = briefs.map((b) => b._id);
    const allTickets = await this.ticketsService.findByBriefIds(ids);
    const ticketsByBrief = new Map<string, TicketDocument[]>();
    for (const t of allTickets) {
      const key = t.briefId.toString();
      const list = ticketsByBrief.get(key) ?? [];
      list.push(t);
      ticketsByBrief.set(key, list);
    }

    return briefs.map((b) => {
      const id = b._id.toHexString();
      const tickets = (ticketsByBrief.get(id) ?? []).map((t) =>
        this.serializeTicket(t),
      );
      return {
        briefId: id,
        fileNames: b.fileNames,
        createdAt: b.get('createdAt') as Date,
        status: b.status,
        tickets,
      };
    });
  }

  async getOne(briefId: Types.ObjectId): Promise<Record<string, unknown>> {
    const brief = await this.briefRepository.findById(briefId);
    if (!brief) {
      throw new NotFoundException('Brief not found.');
    }
    const tickets = await this.ticketsService.findByBriefId(briefId);
    return {
      ...this.serializeBrief(brief),
      tickets: tickets.map((t) => this.serializeTicket(t)),
    };
  }

  private serializeBrief(brief: BriefDocument): Record<string, unknown> {
    return brief.toJSON() as unknown as Record<string, unknown>;
  }

  private serializeTicket(ticket: TicketDocument): Record<string, unknown> {
    return ticket.toJSON() as unknown as Record<string, unknown>;
  }

  private async generateClarifyingQuestions(
    originalText: string,
  ): Promise<string[]> {
    try {
      const model = this.configService.getOrThrow<string>('openai.model');
      const completion = await this.openai.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: AMBIGUITY_SYSTEM },
          {
            role: 'user',
            content: `Client brief text:\n\n${originalText}`,
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) {
        throw new Error('Empty model response');
      }

      const parsed = parseJsonFromModelContent<{ questions?: unknown }>(raw);
      const questions = parsed.questions;
      if (!Array.isArray(questions)) {
        throw new Error('Invalid JSON: "questions" must be an array');
      }
      const out: string[] = [];
      for (const q of questions) {
        if (typeof q !== 'string') {
          throw new Error('Invalid JSON: each question must be a string');
        }
        const trimmed = q.trim();
        if (trimmed.length > 0) {
          out.push(trimmed);
        }
      }
      return out;
    } catch (err) {
      console.error('[Brief] OpenAI ambiguity detection failed', err);
      throw new BadGatewayException(
        'Could not analyze the brief with the AI service. Please try again later.',
      );
    }
  }

  private async generateTicketPayloads(
    originalText: string,
    clarifyingQuestions: string[],
    userAnswers: string[],
  ): Promise<TicketCreateInput[]> {
    const qaLines: string[] = [];
    for (let i = 0; i < clarifyingQuestions.length; i++) {
      qaLines.push(`Q${i + 1}: ${clarifyingQuestions[i]}`);
      qaLines.push(`A${i + 1}: ${userAnswers[i] ?? ''}`);
    }
    const qaBlock =
      qaLines.length > 0
        ? `Clarifying Q&A:\n${qaLines.join('\n')}`
        : 'No clarifying questions were required.';

    try {
      const model = this.configService.getOrThrow<string>('openai.model');
      const completion = await this.openai.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: TICKETS_SYSTEM },
          {
            role: 'user',
            content: `Original brief:\n\n${originalText}\n\n${qaBlock}`,
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) {
        throw new Error('Empty model response');
      }

      const parsed = parseJsonFromModelContent<{ tickets?: unknown }>(raw);
      const tickets = parsed.tickets;
      if (!Array.isArray(tickets) || tickets.length === 0) {
        throw new Error('Invalid JSON: "tickets" must be a non-empty array');
      }

      const priorities = new Set<string>(Object.values(TicketPriority));
      const types = new Set<string>(Object.values(TicketType));

      const ticketList = tickets as unknown[];
      const result: TicketCreateInput[] = [];
      for (let i = 0; i < ticketList.length; i++) {
        const row: unknown = ticketList[i];
        if (typeof row !== 'object' || row === null) {
          throw new Error(`Invalid ticket at index ${i}`);
        }
        const t = row as Record<string, unknown>;
        if (!isNonEmptyString(t.title)) {
          throw new Error(`Invalid ticket at index ${i}: title`);
        }
        if (!isNonEmptyString(t.description)) {
          throw new Error(`Invalid ticket at index ${i}: description`);
        }
        if (!Array.isArray(t.acceptanceCriteria)) {
          throw new Error(
            `Invalid ticket at index ${i}: acceptanceCriteria must be an array`,
          );
        }
        const criteria = t.acceptanceCriteria.filter(isNonEmptyString);
        if (criteria.length === 0) {
          throw new Error(
            `Invalid ticket at index ${i}: acceptanceCriteria must contain at least one string`,
          );
        }
        if (typeof t.priority !== 'string' || !priorities.has(t.priority)) {
          throw new Error(
            `Invalid ticket at index ${i}: priority must be High, Medium, or Low`,
          );
        }
        if (typeof t.type !== 'string' || !types.has(t.type)) {
          throw new Error(
            `Invalid ticket at index ${i}: type must be Frontend, Backend, or Design`,
          );
        }
        result.push({
          title: t.title.trim(),
          description: t.description.trim(),
          acceptanceCriteria: criteria,
          priority: t.priority as TicketPriority,
          type: t.type as TicketType,
        });
      }
      return result;
    } catch (err) {
      console.error('[Brief] OpenAI ticket generation failed', err);
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new BadGatewayException(
        'Could not generate tickets with the AI service. Please try again later.',
      );
    }
  }
}
