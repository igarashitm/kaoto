import { BaseCamelEntity } from '../../../../../models/camel/entities';

export class ParsedTable {
  title: string = '';
  headers: string[] = [];
  data: string[][] = [];

  constructor(init?: Partial<ParsedTable>) {
    Object.assign(this, init);
  }

  static unsupported(entity: BaseCamelEntity) {
    return new ParsedTable({
      title: entity.id,
      headers: ['Notification'],
      data: [[`Not Supported: ${JSON.stringify(entity.toJSON())}`]],
    });
  }
}
