import { MetadataEntity } from '../../../../../models/visualization/metadata';
import { PipeErrorHandlerEntity } from '../../../../../models/visualization/metadata/pipeErrorHandlerEntity';
import { ParsedTable } from './parsed-model';

export class MiscParser {
  static parseMetadataEntity(entity: MetadataEntity): ParsedTable {
    return ParsedTable.unsupported(entity);
  }

  static parsePipeErrorHandlerEntity(entity: PipeErrorHandlerEntity): ParsedTable {
    return ParsedTable.unsupported(entity);
  }
}
