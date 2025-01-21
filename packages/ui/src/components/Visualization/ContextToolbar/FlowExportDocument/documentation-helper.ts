import { BaseVisualCamelEntity, IVisualizationNode } from '../../../../models';
import { MarkdownEntry, TableCell, TableEntry, TableRow, tsMarkdown } from 'ts-markdown';
import JSZip from 'jszip';
import { toBlob } from 'html-to-image';
import { CamelResource } from '../../../../models/camel';
import { IVisibleFlows } from '../../../../models/visualization/flows/support/flows-visibility';
import { isDataMapperNode, XSLT_COMPONENT_NAME } from '../../../../utils';
import { Step } from '@kaoto/camel-catalog/types';

export class DocumentationHelper {
  static generateDocumentationZip(flowImage: Blob, markdownText: string, fileNameBase: string): Promise<Blob> {
    const imageFileName = fileNameBase + '.png';
    const markdownFileName = fileNameBase + '.md';
    const jszip = new JSZip();
    jszip.file(imageFileName, flowImage);
    jszip.file(markdownFileName, markdownText);
    return jszip.generateAsync({ type: 'blob' });
  }

  static generateFlowImage(isDark?: boolean): Promise<Blob | null> {
    const element = document.querySelector<HTMLElement>('.pf-topology-container') ?? undefined;
    if (!element) {
      return Promise.reject('generateMarkdown called but the flow diagram is not found');
    }

    return toBlob(element, {
      cacheBust: true,
      backgroundColor: isDark ? '#0f1214' : '#f0f0f0',
      filter: (element) => {
        {
          /**  Filter @patternfly/react-topology controls */
          return !element?.classList?.contains('pf-v6-c-toolbar__group');
        }
      },
    });
  }

  static generateMarkdown(camelResource: CamelResource, visibleFlows: IVisibleFlows, flowImageFileName: string) {
    const data: MarkdownEntry[] = [
      ' ',
      ...DocumentationHelper.licenseHeader.map((line) => `[comment]: # (${line})`),
      ' ',
      { h1: 'Flow Diagram' },
      { img: { alt: 'Flow Diagram', source: flowImageFileName } },
      { h1: 'Step Details' },
    ];

    const stepTable: TableEntry = {
      table: {
        columns: [
          { name: 'Route ID' },
          { name: 'Step ID' },
          { name: 'Step Type' },
          { name: 'Option Name' },
          { name: 'Value' },
        ],
        rows: [],
      },
    };
    data.push(stepTable);

    stepTable.table.rows = camelResource
      .getVisualEntities()
      .filter((entity) => visibleFlows[entity.id])
      .reduce((acc, entity) => {
        DocumentationHelper.populateVisualEntity(acc, entity);
        return acc;
      }, stepTable.table.rows);
    return tsMarkdown(data);
  }

  private static populateVisualEntity(acc: (TableRow | TableCell[])[], entity: BaseVisualCamelEntity) {
    const vizNode = entity.toVizNode();
    acc.push({
      'Route ID': entity.id,
      'Step ID': '',
      'Step Type': '',
      'Option Name': '',
      Value: '',
    });
    DocumentationHelper.populateVizNode(acc, vizNode, entity.id);
  }

  private static populateVizNode(acc: (TableRow | TableCell[])[], vizNode: IVisualizationNode, routeId: string) {
    if (!vizNode.data.entity) {
      const componentSchema = vizNode.getComponentSchema();
      if (isDataMapperNode(componentSchema?.definition)) {
        DocumentationHelper.populateDataMapperStep(acc, vizNode);
      } else if (componentSchema?.definition.uri) {
        this.populateComponentParameters(acc, vizNode);
      } else {
        this.populateProcessorParameters(acc, vizNode);
      }
    }
    vizNode.getChildren()?.forEach((child) => DocumentationHelper.populateVizNode(acc, child, routeId));
    // branch termination
    acc.push({
      'Route ID': '',
      'Step ID': '',
      'Step Type': '',
      'Option Name': '',
      Value: '',
    });
  }

  private static populateDataMapperStep(acc: (TableRow | TableCell[])[], vizNode: IVisualizationNode) {
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

    acc.push({
      'Route ID': '',
      'Step ID': stepDefinition.id,
      'Step Type': 'Kaoto DataMapper',
      'Option Name': 'XSLT file name',
      Value: xsltFileName || '',
    });
  }

  private static populateComponentParameters(acc: (TableRow | TableCell[])[], vizNode: IVisualizationNode) {
    const componentSchema = vizNode.getComponentSchema();
    if (!componentSchema) {
      return;
    }

    const parameters = componentSchema.definition.parameters;
    if (!parameters || Object.keys(parameters).length === 0) {
      acc.push({
        'Route ID': '',
        'Step ID': componentSchema?.definition.id,
        'Step Type': vizNode.data.componentName as string,
        'Option Name': '',
        Value: '',
      });
      return;
    }

    let first = true;
    Object.entries(componentSchema?.definition.parameters).forEach(([key, value]) => {
      if (value && typeof value === 'object' && Object.keys(value).length === 0) return;
      acc.push({
        'Route ID': '',
        'Step ID': first ? componentSchema?.definition.id : '',
        'Step Type': first ? (vizNode.data.componentName as string) : '',
        'Option Name': key,
        Value: typeof value === 'string' ? value : JSON.stringify(value),
      });
      first = false;
    });
  }

  private static populateProcessorParameters(acc: (TableRow | TableCell[])[], vizNode: IVisualizationNode) {
    const componentSchema = vizNode.getComponentSchema();
    if (!componentSchema) {
      return;
    }

    const stepId = componentSchema.definition.id;
    const filteredDefinition = Object.fromEntries(
      Object.entries(componentSchema.definition).filter(
        ([key, _value]) => !DocumentationHelper.excludedProperties.includes(key),
      ),
    );

    if (Object.keys(filteredDefinition).length === 0) {
      acc.push({
        'Route ID': '',
        'Step ID': stepId,
        'Step Type': vizNode.data.processorName as string,
        'Option Name': '',
        Value: '',
      });
      return;
    }

    let first = true;
    Object.entries(filteredDefinition).forEach(([key, value]) => {
      if (value && typeof value === 'object') {
        DocumentationHelper.populateObjectParameter(acc, vizNode, stepId, first, key, value);
      } else {
        acc.push({
          'Route ID': '',
          'Step ID': first ? stepId : '',
          'Step Type': first ? (vizNode.data.processorName as string) : '',
          'Option Name': key,
          Value: value as string,
        });
      }
      first = false;
    });
  }

  private static populateObjectParameter(
    acc: (TableRow | TableCell[])[],
    vizNode: IVisualizationNode,
    stepId: string,
    first: boolean,
    key: string,
    value: object,
  ) {
    if (Object.keys(value).length === 0) return;
    if (key === 'expression') {
      const expressionType = Object.keys(value)[0];
      acc.push({
        'Route ID': '',
        'Step ID': first ? stepId : '',
        'Step Type': first ? (vizNode.data.processorName as string) : '',
        'Option Name': `expression(${expressionType})`,
        /* eslint-disable  @typescript-eslint/no-explicit-any */
        Value: (value as any)[expressionType].expression,
      });
      return;
    }
    acc.push({
      'Route ID': '',
      'Step ID': first ? stepId : '',
      'Step Type': first ? (vizNode.data.processorName as string) : '',
      'Option Name': key,
      Value: JSON.stringify(value),
    });
  }

  static excludedProperties = ['steps', 'when', 'otherwise', 'id'];

  static licenseHeader: string[] = [
    'Copyright \\(C\\) 2024 Red Hat, Inc.',
    '',
    'Licensed under the Apache License, Version 2.0 \\(the "License"\\);',
    'you may not use this file except in compliance with the License.',
    'You may obtain a copy of the License at',
    '',
    '      http://www.apache.org/licenses/LICENSE-2.0',
    '',
    'Unless required by applicable law or agreed to in writing, software',
    'distributed under the License is distributed on an "AS IS" BASIS,',
    'WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.',
    'See the License for the specific language governing permissions and',
    'limitations under the License.',
  ];
}
