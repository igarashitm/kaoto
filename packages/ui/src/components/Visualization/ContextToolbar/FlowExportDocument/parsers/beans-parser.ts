import { BeansEntity } from '../../../../../models/visualization/metadata';
import { RouteTemplateBeansEntity } from '../../../../../models/visualization/metadata/routeTemplateBeansEntity';
import { ParsedTable } from './parsed-table';

export class BeansParser {
  static parseBeansEntity(entity: BeansEntity): ParsedTable {
    return ParsedTable.unsupported(entity);
  }

  static parseRouteTemplateBeansEntity(entity: RouteTemplateBeansEntity): ParsedTable {
    return ParsedTable.unsupported(entity);
  }
}
