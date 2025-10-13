import { IVisualizationNode } from '../../../../models';
import {
  IInteractionType,
  IModalCustomization,
  IRegisteredInteractionAddon,
} from '../../../registers/interactions/node-interaction-addon.model';
import { IClipboardCopyObject } from '../../../../models/visualization/clipboard';

export const processOnDeleteAddonRecursively = (
  parentVizNode: IVisualizationNode,
  modalAnswer: string | undefined,
  getAddons: (vizNode: IVisualizationNode) => IRegisteredInteractionAddon<IInteractionType.ON_DELETE>[],
) => {
  parentVizNode.getChildren()?.forEach((child) => {
    processOnDeleteAddonRecursively(child, modalAnswer, getAddons);
  });
  getAddons(parentVizNode).forEach((addon) => {
    addon.callback(parentVizNode, modalAnswer);
  });
};

export const findOnDeleteModalCustomizationRecursively = (
  parentVizNode: IVisualizationNode,
  getAddons: (vizNode: IVisualizationNode) => IRegisteredInteractionAddon<IInteractionType.ON_DELETE>[],
) => {
  const modalCustomizations: IModalCustomization[] = [];
  // going breadth-first while addon processes depth-first... do we want?
  getAddons(parentVizNode).forEach((addon) => {
    if (addon.modalCustomization && !modalCustomizations.includes(addon.modalCustomization)) {
      modalCustomizations.push(addon.modalCustomization);
    }
  });
  parentVizNode.getChildren()?.forEach((child) => {
    findOnDeleteModalCustomizationRecursively(child, getAddons).forEach((custom) => {
      if (!modalCustomizations.includes(custom)) {
        modalCustomizations.push(custom);
      }
    });
  });
  return modalCustomizations;
};

/**
 * Helper function to find and replace a definition object within a clipboard content tree by ID.
 * This modifies the tree in place.
 */
const replaceDefinitionById = (
  parentDefinition: any,
  targetId: string,
  newDefinition: any,
): boolean => {
  // Check common container properties that can hold child steps
  const containerProperties = ['steps', 'when', 'otherwise', 'doCatch', 'doFinally'];

  for (const prop of containerProperties) {
    const container = parentDefinition?.[prop];

    // Handle array containers (like steps, when, doCatch)
    if (Array.isArray(container)) {
      for (let i = 0; i < container.length; i++) {
        const item = container[i];
        // Check if this is the target - need to look at the actual processor definition
        const processorDef = Object.values(item)[0] as any; // The first property is the processor
        if (processorDef?.id === targetId) {
          // Replace the entire item (which wraps the processor)
          const processorName = Object.keys(newDefinition)[0];
          container[i] = { [processorName]: newDefinition[processorName] };
          return true;
        }
        // Recursively search in nested structures
        if (replaceDefinitionById(item, targetId, newDefinition)) {
          return true;
        }
      }
    }
    // Handle single object containers (like otherwise)
    else if (container && typeof container === 'object') {
      const processorDef = Object.values(container)[0] as any;
      if (processorDef?.id === targetId) {
        const processorName = Object.keys(newDefinition)[0];
        parentDefinition[prop] = { [processorName]: newDefinition[processorName] };
        return true;
      }
      if (replaceDefinitionById(container, targetId, newDefinition)) {
        return true;
      }
    }
  }

  return false;
};

export const processOnCopyAddonRecursively = async (
  parentVizNode: IVisualizationNode,
  content: IClipboardCopyObject | undefined,
  getAddons: (vizNode: IVisualizationNode) => IRegisteredInteractionAddon<IInteractionType.ON_COPY>[],
): Promise<IClipboardCopyObject | undefined> => {
  if (!content) return content;

  // Process children first (depth-first)
  const children = parentVizNode.getChildren();
  if (children) {
    for (const child of children) {
      // Get the child's clipboard content
      const childContent = child.getCopiedContent();
      if (childContent) {
        // Recursively process the child
        const transformedChildContent = await processOnCopyAddonRecursively(child, childContent, getAddons);

        // Merge the transformed child content back into the parent's content
        if (transformedChildContent) {
          const childId = child.getId();
          if (childId) {
            replaceDefinitionById(content.definition, childId, transformedChildContent.definition);
          }
        }
      }
    }
  }

  // Process this node's addons
  let result = content;
  for (const addon of getAddons(parentVizNode)) {
    const transformed = await addon.callback(parentVizNode, result);
    if (transformed) result = transformed;
  }

  return result;
};

export const processOnDuplicateAddonRecursively = async (
  parentVizNode: IVisualizationNode,
  content: IClipboardCopyObject | undefined,
  getAddons: (vizNode: IVisualizationNode) => IRegisteredInteractionAddon<IInteractionType.ON_DUPLICATE>[],
): Promise<IClipboardCopyObject | undefined> => {
  if (!content) return content;

  // Process children first (depth-first)
  const children = parentVizNode.getChildren();
  if (children) {
    for (const child of children) {
      // Get the child's clipboard content
      const childContent = child.getCopiedContent();
      if (childContent) {
        // Recursively process the child
        const transformedChildContent = await processOnDuplicateAddonRecursively(child, childContent, getAddons);

        // Merge the transformed child content back into the parent's content
        if (transformedChildContent) {
          const childId = child.getId();
          if (childId) {
            replaceDefinitionById(content.definition, childId, transformedChildContent.definition);
          }
        }
      }
    }
  }

  // Process this node's addons
  let result = content;
  for (const addon of getAddons(parentVizNode)) {
    const transformed = await addon.callback(parentVizNode, result);
    if (transformed) result = transformed;
  }

  return result;
};
