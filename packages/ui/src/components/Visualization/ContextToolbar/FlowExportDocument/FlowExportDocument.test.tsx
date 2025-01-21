import { render, screen } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import { SourceCodeProvider } from '../../../../providers/source-code.provider';
import { FlowExportDocument } from './FlowExportDocument';

const wrapper = ({ children }: PropsWithChildren) => <SourceCodeProvider>{children}</SourceCodeProvider>;

describe('FlowExportDocument.tsx', () => {
  beforeEach(() => render(<FlowExportDocument />, { wrapper }));

  afterEach(() => jest.clearAllMocks());

  it('should be render', () => {
    const exportButton = screen.getByTestId('exportDocumentButton');

    expect(exportButton).toBeInTheDocument();
  });
});
