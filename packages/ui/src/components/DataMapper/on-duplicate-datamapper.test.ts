import { onDuplicateDataMapper } from './on-duplicate-datamapper';
import { DataMapperMetadataService } from '../../services/datamapper-metadata.service';
import { IMetadataApi } from '../../providers';
import { IVisualizationNode } from '../../models';
import { IDataMapperMetadata } from '../../models/datamapper/metadata';
import { DocumentDefinitionType } from '../../models/datamapper';
import { IClipboardCopyObject } from '../../models/visualization/clipboard';
import { SourceSchemaType } from '../../models/camel/source-schema-type';

describe('onDuplicateDataMapper', () => {
  let mockApi: jest.Mocked<IMetadataApi>;
  let mockVizNode: jest.Mocked<IVisualizationNode>;
  const originalMetadataId = 'kaoto-datamapper-original-id';
  const newStepId = 'kaoto-datamapper-new-id';

  beforeEach(() => {
    mockApi = {
      getMetadata: jest.fn(),
      setMetadata: jest.fn(),
      getResourceContent: jest.fn(),
      saveResourceContent: jest.fn(),
      deleteResource: jest.fn(),
      askUserForFileSelection: jest.fn(),
      shouldSaveSchema: true,
    } as unknown as jest.Mocked<IMetadataApi>;

    mockVizNode = {} as jest.Mocked<IVisualizationNode>;

    jest.spyOn(DataMapperMetadataService, 'getDataMapperMetadataId').mockReturnValue(originalMetadataId);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create metadata and copy XSLT file for duplicated DataMapper step', async () => {
    const originalMetadata: IDataMapperMetadata = {
      sourceBody: { type: DocumentDefinitionType.XML_SCHEMA, filePath: ['source.xsd'] },
      sourceParameters: {},
      targetBody: { type: DocumentDefinitionType.JSON_SCHEMA, filePath: ['target.json'] },
      xsltPath: `${originalMetadataId}.xsl`,
    };

    const xsltContent = '<xsl:stylesheet>...</xsl:stylesheet>';

    mockApi.getMetadata.mockResolvedValue(originalMetadata);
    mockApi.getResourceContent.mockResolvedValue(xsltContent);

    const content: IClipboardCopyObject = {
      type: SourceSchemaType.Route,
      name: 'step',
      definition: {
        step: {
          id: newStepId,
        },
      },
    };

    await onDuplicateDataMapper(mockApi, mockVizNode, content);

    // Verify metadata was retrieved for the original step
    expect(mockApi.getMetadata).toHaveBeenCalledWith(originalMetadataId);

    // Verify new metadata was created with the new step ID
    expect(mockApi.setMetadata).toHaveBeenCalledWith(newStepId, {
      sourceBody: originalMetadata.sourceBody,
      sourceParameters: originalMetadata.sourceParameters,
      targetBody: originalMetadata.targetBody,
      xsltPath: `${newStepId}.xsl`,
    });

    // Verify XSLT content was retrieved
    expect(mockApi.getResourceContent).toHaveBeenCalledWith(originalMetadata.xsltPath);

    // Verify new XSLT file was created
    expect(mockApi.saveResourceContent).toHaveBeenCalledWith(`${newStepId}.xsl`, xsltContent);
  });

  it('should handle missing duplicated content gracefully', async () => {
    await onDuplicateDataMapper(mockApi, mockVizNode, undefined);

    expect(mockApi.getMetadata).not.toHaveBeenCalled();
    expect(mockApi.setMetadata).not.toHaveBeenCalled();
  });

  it('should handle missing new step ID gracefully', async () => {
    const content: IClipboardCopyObject = {
      type: SourceSchemaType.Route,
      name: 'step',
      definition: {
        step: {},
      },
    };

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await onDuplicateDataMapper(mockApi, mockVizNode, content);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Could not find new step ID in duplicated content');
    expect(mockApi.setMetadata).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should handle missing original metadata gracefully', async () => {
    mockApi.getMetadata.mockResolvedValue(undefined);

    const content: IClipboardCopyObject = {
      type: SourceSchemaType.Route,
      name: 'step',
      definition: {
        step: {
          id: newStepId,
        },
      },
    };

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await onDuplicateDataMapper(mockApi, mockVizNode, content);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Could not find original metadata for DataMapper step');
    expect(mockApi.setMetadata).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should handle missing XSLT content', async () => {
    const originalMetadata: IDataMapperMetadata = {
      sourceBody: { type: DocumentDefinitionType.Primitive, filePath: [] },
      sourceParameters: {},
      targetBody: { type: DocumentDefinitionType.Primitive, filePath: [] },
      xsltPath: `${originalMetadataId}.xsl`,
    };

    mockApi.getMetadata.mockResolvedValue(originalMetadata);
    mockApi.getResourceContent.mockResolvedValue(undefined);

    const content: IClipboardCopyObject = {
      type: SourceSchemaType.Route,
      name: 'step',
      definition: {
        step: {
          id: newStepId,
        },
      },
    };

    await onDuplicateDataMapper(mockApi, mockVizNode, content);

    // Verify metadata was still created
    expect(mockApi.setMetadata).toHaveBeenCalled();

    // Verify XSLT file was not saved since content was missing
    expect(mockApi.saveResourceContent).not.toHaveBeenCalled();
  });
});
