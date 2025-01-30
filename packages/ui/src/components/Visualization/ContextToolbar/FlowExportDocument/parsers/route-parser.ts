import { CamelRouteVisualEntity, IVisualizationNode } from '../../../../../models';
import { isDataMapperNode, XSLT_COMPONENT_NAME } from '../../../../../utils';
import { Step } from '@kaoto/camel-catalog/types';
import { CommonRouteParser } from './common-route-parser';
import { CamelRouteConfigurationVisualEntity } from '../../../../../models/visualization/flows/camel-route-configuration-visual-entity';
import { CamelErrorHandlerVisualEntity } from '../../../../../models/visualization/flows/camel-error-handler-visual-entity';
import { CamelInterceptVisualEntity } from '../../../../../models/visualization/flows/camel-intercept-visual-entity';
import { CamelInterceptFromVisualEntity } from '../../../../../models/visualization/flows/camel-intercept-from-visual-entity';
import { CamelInterceptSendToEndpointVisualEntity } from '../../../../../models/visualization/flows/camel-intercept-send-to-endpoint-visual-entity';
import { CamelOnCompletionVisualEntity } from '../../../../../models/visualization/flows/camel-on-completion-visual-entity';
import { CamelOnExceptionVisualEntity } from '../../../../../models/visualization/flows/camel-on-exception-visual-entity';
import { ParsedTable } from './parsed-table';

export class RouteParser {
  static parseRouteEntity(entity: CamelRouteVisualEntity): ParsedTable {
    const parameterTable: ParsedTable = new ParsedTable({
      title: `${entity.id} Parameters`,
      headers: CommonRouteParser.HEADERS_STEP_PARAMETER,
      data: [[entity.id, '', '', '', '']],
    });

    const vizNode = entity.toVizNode();
    RouteParser.populateVizNode(parameterTable, vizNode, entity.id);
    return parameterTable;
  }

  private static populateVizNode(parsedTable: ParsedTable, vizNode: IVisualizationNode, routeId: string) {
    if (!vizNode.data.entity) {
      const componentSchema = vizNode.getComponentSchema();
      if (isDataMapperNode(componentSchema?.definition)) {
        RouteParser.populateDataMapperStep(parsedTable, vizNode);
      } else if (componentSchema?.definition.uri) {
        CommonRouteParser.populateComponentParameters(parsedTable, vizNode);
      } else {
        CommonRouteParser.populateProcessorParameters(parsedTable, vizNode);
      }
    }
    vizNode.getChildren()?.forEach((child) => RouteParser.populateVizNode(parsedTable, child, routeId));
    // branch termination
    parsedTable.data.push(['', '', '', '', '']);
  }

  private static populateDataMapperStep(parsedTable: ParsedTable, vizNode: IVisualizationNode) {
    const stepDefinition: Step = vizNode.getComponentSchema()?.definition;
    const xsltStep = stepDefinition.steps?.find((step) => {
      if (typeof step.to === 'string') {
        return step.to.startsWith(XSLT_COMPONENT_NAME);
      }
      return step.to?.uri?.startsWith(XSLT_COMPONENT_NAME);
    });
    const xsltFileName =
      typeof xsltStep?.to === 'string'
        ? xsltStep?.to?.substring(XSLT_COMPONENT_NAME.length + 1)
        : xsltStep?.to?.uri?.substring(XSLT_COMPONENT_NAME.length + 1);

    parsedTable.data.push(['', stepDefinition.id || '', 'Kaoto DataMapper', 'XSLT file name', xsltFileName || '']);
  }

  static parseRouteConfigurationEntity(entity: CamelRouteConfigurationVisualEntity): ParsedTable {
    return ParsedTable.unsupported(entity);
  }

  static parseErrorHandlerEntity(entity: CamelErrorHandlerVisualEntity): ParsedTable {
    return ParsedTable.unsupported(entity);
  }

  static parseInterceptEntity(entity: CamelInterceptVisualEntity): ParsedTable {
    return ParsedTable.unsupported(entity);
  }

  static parseInterceptFromEntity(entity: CamelInterceptFromVisualEntity): ParsedTable {
    return ParsedTable.unsupported(entity);
  }

  static parseInterceptSendToEntity(entity: CamelInterceptSendToEndpointVisualEntity): ParsedTable {
    return ParsedTable.unsupported(entity);
  }

  static parseOnCompletionEntity(entity: CamelOnCompletionVisualEntity): ParsedTable {
    return ParsedTable.unsupported(entity);
  }

  static parseOnExceptionEntity(entity: CamelOnExceptionVisualEntity): ParsedTable {
    return ParsedTable.unsupported(entity);
  }
}
