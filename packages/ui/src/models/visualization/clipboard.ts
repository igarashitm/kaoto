import { SourceSchemaType } from '../camel/source-schema-type';

/**
 * Represents the structure of an object that can be copied to/from the clipboard
 * for copy/paste/duplicate operations in the visual editor.
 */
export interface IClipboardCopyObject {
  type: SourceSchemaType;
  name: string;
  definition: object;
}
