import type { JSONSchemaType } from 'ajv';
import { BaseCamelEntity, EntityType } from '../camel-entities/base-entity';

/**
 * BaseVisualCamelEntity
 *
 * This interface is used to represent a visual Camel entity.
 * f.i. Camel Route, Kamelet, KameletBinding, etc.
 * All dedicated Camel code would implemented using this interface.
 */
export interface BaseVisualCamelEntity extends BaseCamelEntity {
  id: string;
  type: EntityType;

  getId: () => string;

  /** Given a path, get the component type and definition */
  getComponentSchema: (path?: string) => VisualComponentSchema | undefined;

  /** Retrieve the steps from the underlying Camel entity */
  getSteps: () => unknown[];

  /** Generates a IVisualizationNode from the underlying Camel entity */
  toVizNode: () => IVisualizationNode;
}

/**
 * IVisualizationNode
 *
 * This interface is used to represent a node in the visualization tree.
 * Usually, each IVisualizationNode represent a component in a BaseVisualCamelEntity.
 *
 * This interface shouldn't know anything about the specific BaseVisualCamelEntity.
 */
export interface IVisualizationNode {
  id: string;
  path: string | undefined;
  label: string;

  /** This property is only set on the root node */
  getBaseEntity(): BaseVisualCamelEntity | undefined;

  getComponentSchema(): VisualComponentSchema | undefined;

  getRootNode(): IVisualizationNode;

  getParentNode(): IVisualizationNode | undefined;

  setParentNode(parentNode?: IVisualizationNode): void;

  getPreviousNode(): IVisualizationNode | undefined;

  setPreviousNode(previousNode: IVisualizationNode): void;

  getNextNode(): IVisualizationNode | undefined;

  setNextNode(node: IVisualizationNode): void;

  getChildren(): IVisualizationNode[] | undefined;

  setChildren(children: IVisualizationNode[]): void;

  addChild(child: IVisualizationNode): void;

  removeChild(child: IVisualizationNode): void;

  populateLeafNodesIds(ids: string[]): void;
}

/**
 * VisualComponentSchema
 *
 * This interface is used to represent a component through
 * the name and the schema of the component.
 */
export interface VisualComponentSchema {
  name: string;
  schema: JSONSchemaType<unknown>;
}
