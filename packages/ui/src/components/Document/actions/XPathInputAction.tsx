import { ExpressionItem } from '../../../models/datamapper/mapping';
import { FormEvent, FunctionComponent, MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionListItem,
  Button,
  ButtonVariant,
  InputGroup,
  InputGroupItem,
  List,
  ListItem,
  Popover,
  TextInput,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { ValidatedXPathParseResult, XPathService } from '../../../services/xpath/xpath.service';

type XPathInputProps = {
  mapping: ExpressionItem;
  onUpdate: () => void;
};
export const XPathInputAction: FunctionComponent<XPathInputProps> = ({ mapping, onUpdate }) => {
  const [validationResult, setValidationResult] = useState<ValidatedXPathParseResult>();

  const validateXPath = useCallback(() => {
    if (mapping.expression) {
      const result = XPathService.validate(mapping.expression);
      setValidationResult(result);
    } else {
      setValidationResult(undefined);
    }
  }, [mapping.expression]);

  useEffect(() => {
    validateXPath();
  }, [validateXPath]);

  const handleXPathChange = useCallback(
    (event: FormEvent, value: string) => {
      if (mapping) {
        mapping.expression = value;
        onUpdate();
      }
      event.stopPropagation();
    },
    [mapping, onUpdate],
  );

  const stopPropagation = useCallback((event: MouseEvent) => {
    event.stopPropagation();
  }, []);

  const errorContent = useMemo(() => {
    return <List>{validationResult?.getErrors().map((e) => <ListItem key={e}>{e}</ListItem>)}</List>;
  }, [validationResult]);

  return (
    <ActionListItem key="xpath-input">
      <InputGroup>
        <InputGroupItem>
          <TextInput
            data-testid="transformation-xpath-input"
            id="xpath"
            type="text"
            value={mapping.expression as string}
            onChange={handleXPathChange}
            onMouseMove={stopPropagation}
          />
        </InputGroupItem>
        {validationResult && !validationResult.getCst() && (
          <InputGroupItem>
            <Popover bodyContent={errorContent}>
              <Button
                data-testid="xpath-input-error-btn"
                variant={ButtonVariant.link}
                isDanger
                icon={<ExclamationCircleIcon />}
              ></Button>
            </Popover>
          </InputGroupItem>
        )}
      </InputGroup>
    </ActionListItem>
  );
};
