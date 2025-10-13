import { IVisualizationNode } from '../../models';
import { IClipboardCopyObject } from '../../models/visualization/clipboard';

/**
 * Fixes the DataMapper copy content to use the correct processor name.
 *
 * The issue is that DataMapper steps use 'kaoto-datamapper' as the processor name
 * for visualization purposes, but the actual Camel DSL uses 'step' EIP.
 * When copying, we need to transform the name from 'kaoto-datamapper' back to 'step'.
 *
 * Note: The recursive processing helper (processOnCopyAddonRecursively) ensures this
 * addon is called for each nested DataMapper step within a branch structure.
 */
export const onCopyDataMapper = (
  _sourceVizNode: IVisualizationNode,
  content: IClipboardCopyObject | undefined,
): IClipboardCopyObject | undefined => {
  if (!content) return undefined;

  if (content.name === 'kaoto-datamapper') {
    return {
      ...content,
      name: 'step',
    };
  }

  return content;
};
