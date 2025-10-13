import { DataMapperMetadataService } from '../../services/datamapper-metadata.service';
import { IMetadataApi } from '../../providers';
import { IVisualizationNode } from '../../models';
import { IDataMapperMetadata } from '../../models/datamapper/metadata';
import { IClipboardCopyObject } from '../../models/visualization/clipboard';

/**
 * Handles DataMapper metadata copying for duplicate operations.
 *
 * The recursive processing helper (processOnDuplicateAddonRecursively) ensures this addon
 * is called for each nested DataMapper step within a branch structure, allowing all nested
 * DataMappers to have their metadata and XSLT files copied.
 *
 * @param api - Metadata API for reading/writing metadata and XSLT files
 * @param sourceVizNode - The source DataMapper visualization node being duplicated
 * @param content - The clipboard content with updated IDs
 */
export const onDuplicateDataMapper = async (
  api: IMetadataApi,
  sourceVizNode: IVisualizationNode,
  content: IClipboardCopyObject | undefined,
) => {
  if (!content) return;

  // Get the original metadata ID from the source node
  const originalMetadataId = DataMapperMetadataService.getDataMapperMetadataId(sourceVizNode);

  // Get the new step ID from the duplicated content
  const newStepId = (content.definition as any)?.step?.id;

  if (!newStepId) {
    console.error('Could not find new step ID in duplicated content');
    return;
  }

  // Get the original metadata
  const originalMetadata = (await api.getMetadata(originalMetadataId)) as IDataMapperMetadata | undefined;

  if (!originalMetadata) {
    console.error('Could not find original metadata for DataMapper step');
    return;
  }

  // Create new metadata for the duplicated step
  const newXsltPath = `${newStepId}.xsl`;
  const newMetadata: IDataMapperMetadata = {
    sourceBody: originalMetadata.sourceBody,
    sourceParameters: originalMetadata.sourceParameters,
    targetBody: originalMetadata.targetBody,
    xsltPath: newXsltPath,
  };

  // Set the new metadata
  await api.setMetadata(newStepId, newMetadata);

  // Copy the XSLT file content from the original to the new file
  const originalXsltContent = await api.getResourceContent(originalMetadata.xsltPath);
  if (originalXsltContent) {
    await api.saveResourceContent(newXsltPath, originalXsltContent);
  }
};
