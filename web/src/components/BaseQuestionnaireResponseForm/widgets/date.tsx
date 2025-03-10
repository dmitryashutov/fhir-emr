import { Form } from 'antd';
import { PickerProps } from 'antd/lib/date-picker/generatePicker';
import moment, { Moment } from 'moment';
import { useCallback, useMemo } from 'react';
import { QuestionItemProps } from 'sdc-qrf';

import { FHIRDateFormat, formatFHIRDate, formatFHIRDateTime } from 'aidbox-react/lib/utils/date';

import { DatePicker } from 'src/components/DatePicker';

import { useFieldController } from '../hooks';

export function QuestionDateTime({ parentPath, questionItem }: QuestionItemProps) {
    const { linkId, text, type } = questionItem;
    const fieldName = [...parentPath, linkId, 0, 'value', type];
    const { value, onChange, disabled, hidden } = useFieldController(fieldName, questionItem);

    return (
        <Form.Item label={text} hidden={hidden}>
            <DateTimePickerWrapper
                type={type}
                onChange={onChange}
                value={value}
                disabled={disabled}
            />
        </Form.Item>
    );
}

type DateTimePickerWrapperProps = PickerProps<moment.Moment> & { type: string };

function DateTimePickerWrapper({ value, onChange, type, disabled }: DateTimePickerWrapperProps) {
    const newValue = useMemo(() => (value ? moment(value) : value), [value]);
    const format = type === 'date' ? FHIRDateFormat : 'YYYY-MM-DD HH:mm';
    const showTime = type === 'date' ? false : { format: 'HH:mm' };
    const formatFunction = type === 'date' ? formatFHIRDate : formatFHIRDateTime;

    const newOnChange = useCallback(
        (value: Moment | null, dateString: string) => {
            if (value) {
                value.toJSON = () => {
                    return formatFunction(value);
                };
            }
            onChange && onChange(value, dateString);
        },
        [onChange, formatFunction],
    );

    return (
        <DatePicker
            showTime={showTime}
            onChange={newOnChange}
            format={format}
            value={newValue}
            disabled={disabled}
        />
    );
}
