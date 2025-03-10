import classNames from 'classnames';
import { QuestionItemProps } from 'sdc-qrf';

import { useFieldController } from 'src/components/BaseQuestionnaireResponseForm/hooks';
import { formatHumanDate, formatHumanDateTime } from 'src/utils/date';

import s from './ReadonlyWidgets.module.scss';

export function QuestionDateTime({ parentPath, questionItem }: QuestionItemProps) {
    const { linkId, text, type } = questionItem;
    const fieldName = [...parentPath, linkId, 0, 'value', type];
    const { value, hidden } = useFieldController(fieldName, questionItem);

    if (hidden) {
        return null;
    }

    return (
        <p className={classNames(s.question, s.row)}>
            <span className={s.questionText}>{text}</span>
            <span className={s.answer}>
                {value
                    ? type === 'dateTime'
                        ? formatHumanDateTime(value)
                        : formatHumanDate(value)
                    : '-'}
            </span>
        </p>
    );
}
