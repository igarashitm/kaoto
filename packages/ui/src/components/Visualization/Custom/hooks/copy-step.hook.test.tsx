import { renderHook } from '@testing-library/react';
import { useCopyStep } from './copy-step.hook';
import { IVisualizationNode } from '../../../../models/visualization/base-visual-entity';
import { ClipboardManager } from '../../../../utils/ClipboardManager';
import { SourceSchemaType } from '../../../../models/camel/source-schema-type';
import { FunctionComponent, PropsWithChildren } from 'react';
import { NodeInteractionAddonContext } from '../../../registers/interactions/node-interaction-addon.provider';
import {
  IInteractionType,
  IRegisteredInteractionAddon,
} from '../../../registers/interactions/node-interaction-addon.model';
import { IClipboardCopyObject } from '../../../../models/visualization/clipboard';

describe('useCopyStep', () => {
  const copySpy = jest.spyOn(ClipboardManager, 'copy').mockImplementation(async (__object) => Promise.resolve());
  const copiedContent = {
    type: SourceSchemaType.Route,
    name: 'exampleNode',
    definition: { id: 'node1', type: 'exampleType' },
  };

  // Mock NodeInteractionAddonContext
  const mockNodeInteractionAddonContext = {
    registerInteractionAddon: jest.fn(),
    getRegisteredInteractionAddons: jest.fn(() => []),
  };

  const wrapper: FunctionComponent<PropsWithChildren> = ({ children }) => (
    <NodeInteractionAddonContext.Provider value={mockNodeInteractionAddonContext}>
      {children}
    </NodeInteractionAddonContext.Provider>
  );

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call ClipboardManager.copy with the copied node content', async () => {
    const mockVizNode = {
      getCopiedContent: jest.fn().mockReturnValue(copiedContent),
      getChildren: jest.fn().mockReturnValue(undefined),
    } as unknown as IVisualizationNode;

    const { result } = renderHook(() => useCopyStep(mockVizNode), { wrapper });
    await result.current.onCopyStep();

    expect(mockVizNode.getCopiedContent).toHaveBeenCalledTimes(1);
    expect(copySpy).toHaveBeenCalledTimes(1);
    expect(copySpy).toHaveBeenCalledWith(copiedContent);
  });

  it('should not call ClipboardManager.copy if getCopiedContent returns null', async () => {
    const mockVizNode = {
      getCopiedContent: jest.fn().mockReturnValue(null),
      getChildren: jest.fn().mockReturnValue(undefined),
    } as unknown as IVisualizationNode;

    const { result } = renderHook(() => useCopyStep(mockVizNode), { wrapper });
    await result.current.onCopyStep();

    expect(mockVizNode.getCopiedContent).toHaveBeenCalledTimes(1);
    expect(copySpy).not.toHaveBeenCalled();
  });

  it('should execute registered copy addons and use modified content', async () => {
    const modifiedContent: IClipboardCopyObject = {
      type: SourceSchemaType.Route,
      name: 'modifiedNode',
      definition: { id: 'node1', type: 'modifiedType' },
    };
    const mockAddonCallback = jest.fn().mockReturnValue(modifiedContent);
    const mockAddons: IRegisteredInteractionAddon[] = [
      {
        type: IInteractionType.ON_COPY,
        activationFn: jest.fn(() => true),
        callback: mockAddonCallback,
      },
    ];

    (mockNodeInteractionAddonContext.getRegisteredInteractionAddons as jest.Mock).mockReturnValue(mockAddons);

    const mockVizNode = {
      getCopiedContent: jest.fn().mockReturnValue(copiedContent),
      getChildren: jest.fn().mockReturnValue(undefined),
    } as unknown as IVisualizationNode;

    const { result } = renderHook(() => useCopyStep(mockVizNode), { wrapper });
    await result.current.onCopyStep();

    // Verify copy addons were retrieved
    expect(mockNodeInteractionAddonContext.getRegisteredInteractionAddons).toHaveBeenCalledWith(
      IInteractionType.ON_COPY,
      mockVizNode,
    );

    // Verify addon callback was executed
    expect(mockAddonCallback).toHaveBeenCalledTimes(1);
    expect(mockAddonCallback).toHaveBeenCalledWith(mockVizNode, copiedContent);

    // Verify the modified content was copied to clipboard
    expect(copySpy).toHaveBeenCalledTimes(1);
    expect(copySpy).toHaveBeenCalledWith(modifiedContent);
  });
});
