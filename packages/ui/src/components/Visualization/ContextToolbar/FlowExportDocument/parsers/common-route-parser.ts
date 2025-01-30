import { IVisualizationNode } from '../../../../../models';
import { ParsedTable } from './parsed-table';

export class CommonRouteParser {
  static readonly HEADERS_STEP_PARAMETER = ['Step ID', 'Step Type', 'Component Name', 'Option Name', 'Value'];
  static readonly EXCLUDED_PROCESSOR_PROPERTIES: ReadonlyArray<string> = ['steps', 'when', 'otherwise', 'id'];

  static populateComponentParameters(parsedTable: ParsedTable, vizNode: IVisualizationNode) {
    const componentSchema = vizNode.getComponentSchema();
    if (!componentSchema) {
      return;
    }

    const parameters = componentSchema.definition.parameters;
    if (!parameters || Object.keys(parameters).length === 0) {
      parsedTable.data.push([
        componentSchema?.definition.id,
        vizNode.data.processorName,
        vizNode.data.componentName as string,
        '',
        '',
      ]);
      return;
    }

    let first = true;
    Object.entries(componentSchema?.definition.parameters).forEach(([key, value]) => {
      if (value && typeof value === 'object' && Object.keys(value).length === 0) return;
      parsedTable.data.push([
        first ? componentSchema?.definition.id : '',
        first ? (vizNode.data.processorName as string) : '',
        first ? (vizNode.data.componentName as string) : '',
        key,
        typeof value === 'string' ? value : JSON.stringify(value),
      ]);
      first = false;
    });
  }

  static populateProcessorParameters(parsedTable: ParsedTable, vizNode: IVisualizationNode) {
    const componentSchema = vizNode.getComponentSchema();
    if (!componentSchema) {
      return;
    }

    const stepId = componentSchema.definition.id;
    const filteredDefinition = Object.fromEntries(
      Object.entries(componentSchema.definition).filter(
        ([key, _value]) => !CommonRouteParser.EXCLUDED_PROCESSOR_PROPERTIES.includes(key),
      ),
    );

    if (Object.keys(filteredDefinition).length === 0) {
      parsedTable.data.push([stepId, vizNode.data.processorName as string, '', '', '']);
      return;
    }

    let first = true;
    Object.entries(filteredDefinition).forEach(([key, value]) => {
      if (value && typeof value === 'object') {
        CommonRouteParser.populateObjectParameter(parsedTable, vizNode, stepId, first, key, value);
      } else {
        parsedTable.data.push([
          first ? stepId : '',
          first ? (vizNode.data.processorName as string) : '',
          '',
          key,
          value as string,
        ]);
      }
      first = false;
    });
  }

  private static populateObjectParameter(
    parsedTable: ParsedTable,
    vizNode: IVisualizationNode,
    stepId: string,
    first: boolean,
    key: string,
    value: object,
  ) {
    if (Object.keys(value).length === 0) return;
    if (key === 'expression') {
      const expressionType = Object.keys(value)[0];
      parsedTable.data.push([
        first ? stepId : '',
        first ? (vizNode.data.processorName as string) : '',
        '',
        `expression (${expressionType})`,
        /* eslint-disable  @typescript-eslint/no-explicit-any */
        (value as any)[expressionType].expression,
      ]);
      return;
    }
    parsedTable.data.push([
      first ? stepId : '',
      first ? (vizNode.data.processorName as string) : '',
      '',
      key,
      JSON.stringify(value),
    ]);
  }
}
