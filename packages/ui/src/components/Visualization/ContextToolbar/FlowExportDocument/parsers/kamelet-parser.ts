import { KameletVisualEntity } from '../../../../../models';
import { ParsedTable } from './parsed-model';

export class KameletParser {
  static parseKameletEntity(entity: KameletVisualEntity) {
    return ParsedTable.unsupported(entity);
  }
}
