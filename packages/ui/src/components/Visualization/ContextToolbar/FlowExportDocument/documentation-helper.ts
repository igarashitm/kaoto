import {
  BaseVisualCamelEntity,
  CamelRouteVisualEntity,
  KameletBindingVisualEntity,
  KameletVisualEntity,
  PipeVisualEntity,
} from '../../../../models';
import { MarkdownEntry, TableRow, tsMarkdown } from 'ts-markdown';
import JSZip from 'jszip';
import { toBlob } from 'html-to-image';
import { CamelRestVisualEntity } from '../../../../models/visualization/flows/camel-rest-visual-entity';
import { CamelRestConfigurationVisualEntity } from '../../../../models/visualization/flows/camel-rest-configuration-visual-entity';
import { CamelRouteConfigurationVisualEntity } from '../../../../models/visualization/flows/camel-route-configuration-visual-entity';
import { BaseCamelEntity } from '../../../../models/camel/entities';
import { BeansEntity, MetadataEntity } from '../../../../models/visualization/metadata';
import { PipeErrorHandlerEntity } from '../../../../models/visualization/metadata/pipeErrorHandlerEntity';
import { RouteTemplateBeansEntity } from '../../../../models/visualization/metadata/routeTemplateBeansEntity';
import { CamelErrorHandlerVisualEntity } from '../../../../models/visualization/flows/camel-error-handler-visual-entity';
import { CamelInterceptVisualEntity } from '../../../../models/visualization/flows/camel-intercept-visual-entity';
import { CamelInterceptFromVisualEntity } from '../../../../models/visualization/flows/camel-intercept-from-visual-entity';
import { CamelInterceptSendToEndpointVisualEntity } from '../../../../models/visualization/flows/camel-intercept-send-to-endpoint-visual-entity';
import { CamelOnCompletionVisualEntity } from '../../../../models/visualization/flows/camel-on-completion-visual-entity';
import { CamelOnExceptionVisualEntity } from '../../../../models/visualization/flows/camel-on-exception-visual-entity';
import { BeansParser } from './parsers/beans-parser';
import { RestParser } from './parsers/rest-parser';
import { RouteParser } from './parsers/route-parser';
import { MiscParser } from './parsers/misc-parser';
import { ParsedTable } from './parsers/parsed-model';
import { KameletParser } from './parsers/kamelet-parser';
import { PipeParser } from './parsers/pipe-parser';

export class DocumentationHelper {
  static readonly MD_LICENSE_HEADER: ReadonlyArray<string> = [
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
      return Promise.reject('generateFlowImage called but the flow diagram is not found');
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

  static generateMarkdown(
    visualEntities: BaseVisualCamelEntity[],
    nonVisualEntities: BaseCamelEntity[],
    flowImageFileName: string,
  ) {
    const markdown: MarkdownEntry[] = [
      ' ',
      ...DocumentationHelper.MD_LICENSE_HEADER.map((line) => `[comment]: # (${line})`),
      ' ',
      { h1: 'Diagram' },
      { img: { alt: 'Diagram', source: flowImageFileName } },
    ];

    visualEntities.forEach((entity) => {
      const parsedTables = DocumentationHelper.parseVisualEntity(entity);
      parsedTables &&
        (Array.isArray(parsedTables) ? parsedTables : [parsedTables]).forEach((table) =>
          DocumentationHelper.populateParsedTable(markdown, table),
        );
    });
    nonVisualEntities.forEach((entity) => {
      const parsedTables = DocumentationHelper.parseEntity(entity);
      parsedTables &&
        (Array.isArray(parsedTables) ? parsedTables : [parsedTables]).forEach((table) =>
          DocumentationHelper.populateParsedTable(markdown, table),
        );
    });
    return tsMarkdown(markdown);
  }

  private static populateParsedTable(markdown: MarkdownEntry[], parsedTable: ParsedTable) {
    const title: Record<string, string> = {};
    title[parsedTable.headingLevel] = parsedTable.title;
    markdown.push(title);
    parsedTable.description && markdown.push({ text: parsedTable.description });

    const rows: TableRow[] = parsedTable.data.reduce((acc, rowData) => {
      const row: TableRow = {};
      for (let colIndex = 0; colIndex < parsedTable.headers.length; colIndex++) {
        row[parsedTable.headers[colIndex]] = rowData[colIndex];
      }
      acc.push(row);
      return acc;
    }, [] as TableRow[]);

    rows.length > 0 &&
      markdown.push(
        {
          table: {
            columns: parsedTable.headers,
            rows: rows,
          },
        },
        {},
      );
  }

  private static parseVisualEntity(entity: BaseVisualCamelEntity): ParsedTable[] | ParsedTable | undefined {
    if (entity instanceof CamelRestConfigurationVisualEntity) {
      return RestParser.parseRestConfigurationEntity(entity);
    } else if (entity instanceof CamelRestVisualEntity) {
      return RestParser.parseRestEntity(entity);
    } else if (entity instanceof CamelRouteConfigurationVisualEntity) {
      return RouteParser.parseRouteConfigurationEntity(entity);
    } else if (entity instanceof CamelRouteVisualEntity) {
      return RouteParser.parseRouteEntity(entity);
    } else if (entity instanceof CamelErrorHandlerVisualEntity) {
      return RouteParser.parseErrorHandlerEntity(entity);
    } else if (entity instanceof CamelInterceptVisualEntity) {
      return RouteParser.parseInterceptEntity(entity);
    } else if (entity instanceof CamelInterceptFromVisualEntity) {
      return RouteParser.parseInterceptFromEntity(entity);
    } else if (entity instanceof CamelInterceptSendToEndpointVisualEntity) {
      return RouteParser.parseInterceptSendToEndpointEntity(entity);
    } else if (entity instanceof CamelOnCompletionVisualEntity) {
      return RouteParser.parseOnCompletionEntity(entity);
    } else if (entity instanceof CamelOnExceptionVisualEntity) {
      return RouteParser.parseOnExceptionEntity(entity);
    } else if (entity instanceof KameletVisualEntity) {
      return KameletParser.parseKameletEntity(entity);
    } else if (entity instanceof PipeVisualEntity) {
      return PipeParser.parsePipeEntity(entity);
    } else if (entity instanceof KameletBindingVisualEntity) {
      return PipeParser.parseKameletBindingEntity(entity);
    }
    return ParsedTable.unsupported(entity);
  }

  private static parseEntity(entity: BaseCamelEntity): ParsedTable | undefined {
    if (entity instanceof BeansEntity || entity instanceof RouteTemplateBeansEntity) {
      return BeansParser.parseBeansEntity(entity);
    } else if (entity instanceof MetadataEntity) {
      return MiscParser.parseMetadataEntity(entity);
    } else if (entity instanceof PipeErrorHandlerEntity) {
      return MiscParser.parsePipeErrorHandlerEntity(entity);
    }
    return ParsedTable.unsupported(entity);
  }
}
