import { IVisualizationNode } from '../../models';
import { IClipboardCopyObject } from '../../models/visualization/clipboard';
import { IMetadataApi } from '../../providers';
import { isDataMapperNode } from '../../utils/is-datamapper';
import { IDataMapperMetadata } from '../../models/datamapper/metadata';

/**
 * Recursively scans clipboard content to build a map of original DataMapper IDs to new IDs.
 * This works generically with any Camel DSL structure by recursively traversing all properties.
 *
 * @param original - Original clipboard content (before updateIds)
 * @param updated - Updated clipboard content (after updateIds)
 * @returns Map of original ID -> new ID for all DataMapper steps found
 */
const mapDataMapperIds = (original: any, updated: any): Map<string, string> => {
  const idMap = new Map<string, string>();

  if (!original || !updated || typeof original !== 'object' || typeof updated !== 'object') {
    return idMap;
  }

  // Check if current node is a DataMapper step
  if (isDataMapperNode(original)) {
    const originalId = original.id;
    const updatedId = updated.id;
    if (originalId && updatedId) {
      idMap.set(originalId, updatedId);
    }
  }

  // Recursively process ALL properties (generic, works with any Camel structure)
  for (const key of Object.keys(original)) {
    const origValue = original[key];
    const updatedValue = updated[key];

    if (Array.isArray(origValue) && Array.isArray(updatedValue)) {
      for (const [i, item] of origValue.entries()) {
        if (updatedValue[i]) {
          const nested = mapDataMapperIds(item, updatedValue[i]);
          for (const [k, v] of nested) idMap.set(k, v);
        }
      }
    } else if (typeof origValue === 'object' && origValue !== null) {
      const nested = mapDataMapperIds(origValue, updatedValue);
      for (const [k, v] of nested) idMap.set(k, v);
    }
  }

  return idMap;
};

/**
 * Handles DataMapper metadata copying for paste operations.
 *
 * For paste operations from external clipboard, we don't have access to source vizNodes.
 * Instead, we:
 * 1. Receive both original and updated clipboard content
 * 2. Recursively scan both to build a mapping of original IDs -> new IDs
 * 3. For each DataMapper found, copy metadata from original ID to new ID (if it exists)
 *
 * This handles nested DataMappers within branches automatically by recursively scanning
 * the entire clipboard content structure.
 *
 * @param api
 * @param _targetVizNode - The target node where content is being pasted (unused)
 * @param originalContent - Clipboard content before updateIds (preserves original IDs)
 * @param updatedContent - Clipboard content after updateIds (contains new IDs)
 */
export const onPasteDataMapper = async (
  api: IMetadataApi,
  _targetVizNode: IVisualizationNode,
  originalContent: IClipboardCopyObject | undefined,
  updatedContent: IClipboardCopyObject | undefined,
) => {
  if (!originalContent || !updatedContent) return;

  // Check if the top-level content is a DataMapper, if not skip entirely
  if (!isDataMapperNode(originalContent.definition)) {
    return;
  }

  // Build a map of all DataMapper IDs: original -> new
  const idMapping = mapDataMapperIds(originalContent.definition, updatedContent.definition);

  if (idMapping.size === 0) {
    // No DataMappers found
    return;
  }

  // For each DataMapper, try to copy metadata if it exists
  for (const [originalId, newId] of idMapping.entries()) {
    try {
      // Try to get metadata using original ID
      const originalMetadata = (await api.getMetadata(originalId)) as IDataMapperMetadata | undefined;

      if (!originalMetadata) {
        // Metadata doesn't exist in this session (external paste), skip
        continue;
      }

      // Create new metadata with updated xsltPath
      const newXsltPath = `${newId}.xsl`;
      const newMetadata: IDataMapperMetadata = {
        sourceBody: originalMetadata.sourceBody,
        sourceParameters: originalMetadata.sourceParameters,
        targetBody: originalMetadata.targetBody,
        xsltPath: newXsltPath,
      };

      // Set the new metadata
      await api.setMetadata(newId, newMetadata);

      // Copy XSLT file content
      const originalXsltContent = await api.getResourceContent(originalMetadata.xsltPath);
      if (originalXsltContent) {
        await api.saveResourceContent(newXsltPath, originalXsltContent);
      }
    } catch (error) {
      // Silently skip if metadata doesn't exist or can't be copied
      console.debug(`Could not copy metadata for DataMapper ${originalId} -> ${newId}:`, error);
    }
  }
};
