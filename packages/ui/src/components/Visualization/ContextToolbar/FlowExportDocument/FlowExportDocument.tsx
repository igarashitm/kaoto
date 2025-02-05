import {
  Button,
  Checkbox,
  Form,
  FormGroup,
  ModalBody,
  ModalHeader,
  TextInput,
  Toolbar,
  ToolbarItem,
} from '@patternfly/react-core';
import { DownloadIcon, FileIcon } from '@patternfly/react-icons';
import { Modal, ModalVariant } from '@patternfly/react-core/deprecated';
import { DocumentationHelper } from './documentation-helper';
import { getVisualizationNodesFromGraph } from '../../../../utils';
import { useVisualizationController } from '@patternfly/react-topology';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Element } from 'hast';
import { useContext, useState } from 'react';
import { IVisualizationNode } from '../../../../models';
import './FlowExportDocument.scss';
import { EntitiesContext, VisibleFlowsContext } from '../../../../providers';
import { markdownComponentMapping } from './MarkdownComponentMapping';
import { BaseCamelEntity } from '../../../../models/camel/entities';
import { BeansEntity, MetadataEntity } from '../../../../models/visualization/metadata';
import { RouteTemplateBeansEntity } from '../../../../models/visualization/metadata/routeTemplateBeansEntity';
import { PipeErrorHandlerEntity } from '../../../../models/visualization/metadata/pipeErrorHandlerEntity';

export const defaultTooltipText = 'Export as image';

export function FlowExportDocument() {
  const fileNameBase = 'route-export';
  const controller = useVisualizationController();
  const { camelResource } = useContext(EntitiesContext)!;
  const { visibleFlows } = useContext(VisibleFlowsContext)!;

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [markdownText, setMarkdownText] = useState<string>('');
  const [flowImageBlob, setFlowImageBlob] = useState<Blob>();
  const [vizNodes, setVizNodes] = useState<IVisualizationNode[]>();
  const [downloadFileName, setDownloadFileName] = useState<string>(fileNameBase + '.zip');

  const visualEntities = camelResource.getVisualEntities();
  const nonVisualEntities = camelResource
    .getEntities()
    .filter((entity) => !(visualEntities as BaseCamelEntity[]).includes(entity));
  const [nonVisualEntitiesVisibility, setNonVisualEntitiesVisibility] = useState<boolean[]>(
    nonVisualEntities.map(() => true),
  );

  const onOpenPreview = async () => {
    const vizNodes = getVisualizationNodesFromGraph(controller.getGraph());
    visibleFlows;
    setVizNodes(vizNodes);

    const imageBlob = await DocumentationHelper.generateFlowImage();
    if (!imageBlob) {
      console.error('Failed to generate flow diagram image');
      return;
    }
    setFlowImageBlob(imageBlob);
    const imageUrl = window.URL.createObjectURL(imageBlob);
    if (!imageUrl) {
      console.error('Failed to create image URL');
      return;
    }

    const filteredVisualEntities = visualEntities.filter((entity) => visibleFlows[entity.id]);
    const filteredNonVisualEntities = nonVisualEntities.filter((_entity, index) => nonVisualEntitiesVisibility[index]);
    const md = await DocumentationHelper.generateMarkdown(filteredVisualEntities, filteredNonVisualEntities, imageUrl);
    setMarkdownText(md);
    setIsModalOpen(true);
  };

  const onDownload = async () => {
    if (!vizNodes || !flowImageBlob) return;

    const filteredVisualEntities = visualEntities.filter((entity) => visibleFlows[entity.id]);
    const filteredNonVisualEntities = nonVisualEntities.filter((_entity, index) => nonVisualEntitiesVisibility[index]);
    const md = await DocumentationHelper.generateMarkdown(
      filteredVisualEntities,
      filteredNonVisualEntities,
      fileNameBase + '.png',
    );

    const zipBlob = await DocumentationHelper.generateDocumentationZip(flowImageBlob, md, fileNameBase);
    const dataUrl = window.URL.createObjectURL(zipBlob);
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = downloadFileName;
    link.href = dataUrl;
    link.click();
  };

  const imageUrlTransform = (url: string, _key: string, _node: Readonly<Element>): string | null | undefined => url;

  const handleCheckboxChange = (checked: boolean, entityIndex: number) => {
    nonVisualEntitiesVisibility[entityIndex] = checked;
    setNonVisualEntitiesVisibility([...nonVisualEntitiesVisibility]);
    onOpenPreview();
  };

  const getNonVisualEntityLabel = (entity: BaseCamelEntity): string => {
    if (entity instanceof BeansEntity || entity instanceof RouteTemplateBeansEntity) return 'Beans';
    if (entity instanceof MetadataEntity) return 'Metadata';
    if (entity instanceof PipeErrorHandlerEntity) return 'Pipe Error Handler';
    return entity.constructor.name;
  };

  return (
    <>
      <Button
        icon={<FileIcon />}
        title="Route Documentation Preview"
        onClick={onOpenPreview}
        variant="control"
        data-testid="documentationPreviewButton"
      />
      <Modal
        aria-label="Route Documentation Preview"
        variant={ModalVariant.large}
        isOpen={isModalOpen}
        data-testid="documentationPreviewModal"
        onClose={() => setIsModalOpen(false)}
      >
        <ModalHeader>
          <Form>
            <Toolbar isSticky>
              <ToolbarItem>
                <FormGroup label="Download File Name">
                  <TextInput
                    aria-label="Download File Name"
                    type="text"
                    value={downloadFileName}
                    onChange={(_event, value) => setDownloadFileName(value)}
                  />
                </FormGroup>
                <FormGroup label=" ">
                  <Button icon={<DownloadIcon />} variant="primary" onClick={onDownload}>
                    Download
                  </Button>
                </FormGroup>
                <FormGroup label=" "></FormGroup>
                {nonVisualEntities.length > 0 && (
                  <FormGroup label="Metadata Visibility" isInline>
                    {nonVisualEntities.map((entity, index) => (
                      <Checkbox
                        id={`checkbox-id-${index}`}
                        key={`checkbox-key-${index}`}
                        onChange={(_event, checked) => handleCheckboxChange(checked, index)}
                        isChecked={nonVisualEntitiesVisibility[index]}
                        label={getNonVisualEntityLabel(entity)}
                      />
                    ))}
                  </FormGroup>
                )}
              </ToolbarItem>
            </Toolbar>
          </Form>
        </ModalHeader>
        <ModalBody tabIndex={0} className="export-document-preview-body">
          <Markdown components={markdownComponentMapping} remarkPlugins={[remarkGfm]} urlTransform={imageUrlTransform}>
            {markdownText}
          </Markdown>
        </ModalBody>
      </Modal>
    </>
  );
}
