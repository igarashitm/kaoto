import {
  Button,
  Content,
  ContentVariants,
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
import Markdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Element } from 'hast';
import { useContext, useState } from 'react';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { IVisualizationNode } from '../../../../models';
import './FlowExportDocument.scss';
import { EntitiesContext, VisibleFlowsContext } from '../../../../providers';

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

    const md = await DocumentationHelper.generateMarkdown(camelResource, visibleFlows, imageUrl);
    setMarkdownText(md);
    setIsModalOpen(true);
  };

  const onDownload = async () => {
    if (!vizNodes || !flowImageBlob) return;

    const md = await DocumentationHelper.generateMarkdown(camelResource, visibleFlows, fileNameBase + '.png');

    const zipBlob = await DocumentationHelper.generateDocumentationZip(flowImageBlob, md, fileNameBase);
    const dataUrl = window.URL.createObjectURL(zipBlob);
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = downloadFileName;
    link.href = dataUrl;
    link.click();
  };

  const imageUrlTransform = (url: string, _key: string, _node: Readonly<Element>): string | null | undefined => url;

  const markdownComponents: Components = {
    p: ({ children }) => <Content component={ContentVariants.p}>{children}</Content>,
    h1: ({ children }) => <Content component={ContentVariants.h1}>{children}</Content>,
    h2: ({ children }) => <Content component={ContentVariants.h2}>{children}</Content>,
    h3: ({ children }) => <Content component={ContentVariants.h3}>{children}</Content>,
    h4: ({ children }) => <Content component={ContentVariants.h4}>{children}</Content>,
    h5: ({ children }) => <Content component={ContentVariants.h5}>{children}</Content>,
    h6: ({ children }) => <Content component={ContentVariants.h6}>{children}</Content>,
    table: ({ children }) => (
      <Table borders isStriped isStickyHeader>
        {children}
      </Table>
    ),
    thead: ({ children }) => <Thead>{children}</Thead>,
    tbody: ({ children }) => <Tbody>{children}</Tbody>,
    tr: ({ children }) => <Tr isBorderRow>{children}</Tr>,
    th: ({ children }) => (
      <Th hasLeftBorder hasRightBorder>
        {children}
      </Th>
    ),
    td: ({ children }) => (
      <Td hasLeftBorder hasRightBorder>
        {children}
      </Td>
    ),
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
              </ToolbarItem>
            </Toolbar>
          </Form>
        </ModalHeader>
        <ModalBody tabIndex={0} className="export-document-preview-body">
          <Markdown components={markdownComponents} remarkPlugins={[remarkGfm]} urlTransform={imageUrlTransform}>
            {markdownText}
          </Markdown>
        </ModalBody>
      </Modal>
    </>
  );
}
