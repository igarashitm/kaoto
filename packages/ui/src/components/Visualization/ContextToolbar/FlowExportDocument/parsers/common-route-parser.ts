import { ParsedStep } from './parsed-model';
import { FromDefinition, ProcessorDefinition, Step } from '@kaoto/camel-catalog/types';
import { isDataMapperNode, XSLT_COMPONENT_NAME } from '../../../../../utils';

type ComponentDefinition = {
  id?: string;
  uri: string;
  description?: string;
  parameters?: { [p: string]: unknown };
};

type AnyProcessorDefinition = {
  id?: string;
  description?: string;
};

export class CommonRouteParser {
  static readonly EXCLUDED_COMPONENT_PROPERTIES: ReadonlyArray<string> = [];
  static readonly EXCLUDED_PROCESSOR_PROPERTIES: ReadonlyArray<string> = ['steps', 'when', 'otherwise', 'id'];
  static readonly EXPRESSION_PARAMETERS: ReadonlyArray<string> = [
    'expression',
    'completionPredicate',
    'completionSizeExpression',
    'completionTimeoutExpression',
    'correlationExpression',
    'onWhen',
  ];

  static parseFrom(fromModel: FromDefinition) {
    const parsedSteps: ParsedStep[] = [];
    const parsedFrom = CommonRouteParser.parseComponentStep('from', fromModel);
    parsedFrom && parsedSteps.push(parsedFrom);
    const parsedSubSteps = CommonRouteParser.parseSteps(fromModel.steps);
    parsedSteps.push(...parsedSubSteps);
    return parsedSteps;
  }

  static parseSteps(stepsModel: ProcessorDefinition[]): ParsedStep[] {
    const parsedSteps: ParsedStep[] = [];
    stepsModel.forEach((step) => {
      const [stepType, stepModel] = Object.entries(step)[0];
      if (stepModel.uri) {
        const parsedStep = CommonRouteParser.parseComponentStep(stepType, stepModel);
        parsedSteps.push(parsedStep);
      } else if (stepType === 'step' && isDataMapperNode(stepModel)) {
        const parsedStep = CommonRouteParser.parseDataMapperStep(stepModel);
        parsedSteps.push(parsedStep);
      } else {
        const parsedStep = CommonRouteParser.parseProcessorStep(stepType, stepModel);
        parsedSteps.push(parsedStep);
        if (stepModel.steps && stepModel.steps.length > 0) {
          const parsedSubSteps = CommonRouteParser.parseSteps(stepModel.steps);
          parsedSteps.push(...parsedSubSteps);
        }
      }
    });
    return parsedSteps;
  }

  private static parseDataMapperStep(stepDefinition: Step): ParsedStep {
    const xsltStep = stepDefinition.steps?.find((step) => {
      if (typeof step.to === 'string') {
        return step.to.startsWith(XSLT_COMPONENT_NAME);
      }
      return step.to?.uri?.startsWith(XSLT_COMPONENT_NAME);
    });
    const xsltFileName =
      typeof xsltStep?.to === 'string'
        ? xsltStep?.to?.substring(XSLT_COMPONENT_NAME.length + 1)
        : xsltStep?.to?.uri?.substring(XSLT_COMPONENT_NAME.length + 1);

    return new ParsedStep({
      id: stepDefinition.id,
      description: stepDefinition.description,
      uri: '',
      name: 'Kaoto DataMapper',
      parameters: { 'XSLT file name': xsltFileName || '' },
    });
  }

  static parseComponentStep(stepType: string, stepModel: ComponentDefinition): ParsedStep {
    const parsedStep = new ParsedStep({ id: stepModel.id, name: stepType, uri: stepModel.uri });
    if (stepModel.parameters) {
      parsedStep.parameters = CommonRouteParser.parseParameters(
        stepModel.parameters,
        CommonRouteParser.EXCLUDED_COMPONENT_PROPERTIES,
      );
    }
    return parsedStep;
  }

  static parseProcessorStep(processorType: string, processorModel: AnyProcessorDefinition): ParsedStep {
    const parsedStep = new ParsedStep({
      id: processorModel.id,
      name: processorType,
      uri: '',
      description: processorModel.description,
    });
    const filteredParameters = Object.fromEntries(
      Object.entries(processorModel).filter(([key]) => !CommonRouteParser.EXCLUDED_PROCESSOR_PROPERTIES.includes(key)),
    );

    const parsedParameters = CommonRouteParser.parseParameters(
      filteredParameters,
      CommonRouteParser.EXCLUDED_PROCESSOR_PROPERTIES,
    );
    Object.entries(parsedParameters).forEach(([key, value]) => (parsedStep.parameters[key] = value));
    return parsedStep;
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  static parseParameters(
    model: Record<string, any>,
    excluded: ReadonlyArray<string> = [],
    prefix?: string,
  ): Record<string, string> {
    const answer: Record<string, string> = {};
    Object.entries(model)
      .filter(([key]) => !excluded.includes(key))
      .forEach(([key, value]) => {
        if (typeof value === 'string') {
          answer[prefix ? `${prefix}.${key}` : key] = value;
          return;
        }
        if (CommonRouteParser.EXPRESSION_PARAMETERS.includes(key)) {
          const expressionType = Object.keys(value)[0];
          answer[`${key} (${expressionType})`] = value[expressionType].expression;
          return;
        }
        const objParams = CommonRouteParser.parseParameters(value, excluded, prefix ? prefix + '.' + key : key);
        Object.assign(answer, objParams);
      });
    return answer;
  }
}
