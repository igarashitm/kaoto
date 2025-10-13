import { createContext, FunctionComponent, PropsWithChildren, useCallback, useMemo, useRef } from 'react';
import { IVisualizationNode } from '../../../models';
import {
  IInteractionType,
  IInteractionAddonTypes,
  INodeInteractionAddonContext,
  IRegisteredInteractionAddon,
} from './node-interaction-addon.model';

export const NodeInteractionAddonContext = createContext<INodeInteractionAddonContext>({
  registerInteractionAddon: () => {},
  getRegisteredInteractionAddons: () => [],
});

export const NodeInteractionAddonProvider: FunctionComponent<PropsWithChildren> = ({ children }) => {
  const registeredInteractionAddons = useRef<IInteractionAddonTypes[]>([]);

  const registerInteractionAddon = useCallback(
    <T extends IInteractionType>(interaction: IRegisteredInteractionAddon<T>) => {
      registeredInteractionAddons.current.push(interaction);
    },
    [],
  );

  const getRegisteredInteractionAddons = useCallback(
    <T extends IInteractionType>(interaction: T, vizNode?: IVisualizationNode) => {
      return registeredInteractionAddons.current.filter((addon): addon is IRegisteredInteractionAddon<T> => {
        // For paste operations without vizNode, return all addons of the type
        if (vizNode === undefined) {
          return addon.type === interaction;
        }
        // For other operations, use activationFn to check compatibility
        return addon.type === interaction && addon.activationFn(vizNode);
      });
    },
    [],
  );

  const value = useMemo(
    () => ({
      registerInteractionAddon,
      getRegisteredInteractionAddons,
    }),
    [getRegisteredInteractionAddons, registerInteractionAddon],
  );

  return <NodeInteractionAddonContext.Provider value={value}>{children}</NodeInteractionAddonContext.Provider>;
};
