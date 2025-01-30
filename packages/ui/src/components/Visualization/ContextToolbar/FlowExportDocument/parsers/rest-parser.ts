import { CamelRestConfigurationVisualEntity } from '../../../../../models/visualization/flows/camel-rest-configuration-visual-entity';
import { CamelRestVisualEntity } from '../../../../../models/visualization/flows/camel-rest-visual-entity';
import { ParsedTable } from './parsed-table';

export class RestParser {
  static parseRestConfigurationEntity(entity: CamelRestConfigurationVisualEntity): ParsedTable {
    return ParsedTable.unsupported(entity);
  }

  static parseRestEntity(entity: CamelRestVisualEntity): ParsedTable {
    return ParsedTable.unsupported(entity);
  }
}
