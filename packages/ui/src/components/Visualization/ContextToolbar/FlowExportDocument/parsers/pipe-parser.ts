import { KameletBindingVisualEntity, PipeVisualEntity } from '../../../../../models';
import { ParsedTable } from './parsed-model';

export class PipeParser {
  static parsePipeEntity(entity: PipeVisualEntity) {
    return ParsedTable.unsupported(entity);
  }

  static parseKameletBindingEntity(entity: KameletBindingVisualEntity) {
    return ParsedTable.unsupported(entity);
  }
}
