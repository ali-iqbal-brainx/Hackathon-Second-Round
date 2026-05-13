import { IsArray, IsString } from 'class-validator';

export class SubmitBriefAnswersDto {
  @IsArray()
  @IsString({ each: true })
  answers: string[];
}
