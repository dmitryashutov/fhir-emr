import {
    AlertOutlined,
    ContactsOutlined,
    ExperimentOutlined,
    HeartOutlined,
} from '@ant-design/icons';
import { t, Trans } from '@lingui/macro';
import { Button, notification } from 'antd';
import _ from 'lodash';

import { RenderRemoteData } from 'aidbox-react/lib/components/RenderRemoteData';
import { useService } from 'aidbox-react/lib/hooks/service';
import { extractBundleResources, getFHIRResources } from 'aidbox-react/lib/services/fhir';
import { mapSuccess, resolveMap } from 'aidbox-react/lib/services/service';

import {
    AllergyIntolerance,
    Immunization,
    MedicationStatement,
    Observation,
    Patient,
} from 'shared/src/contrib/aidbox';
import { questionnaireIdLoader } from 'shared/src/hooks/questionnaire-response-form-data';

import { DashboardCard, DashboardCardTable } from 'src/components/DashboardCard';
import { ModalTrigger } from 'src/components/ModalTrigger';
import { QuestionnaireResponseForm } from 'src/components/QuestionnaireResponseForm';
import { Spinner } from 'src/components/Spinner';
import { formatHumanDate, getPersonAge } from 'src/utils/date';

import medicationIcon from './images/medication.svg';
import s from './PatientOverview.module.scss';

interface Props {
    patient: Patient;
    reload: () => void;
}

interface OverviewCard<T = any> {
    title: string;
    icon: React.ReactNode;
    data: T[];
    columns: {
        key: string;
        title: string;
        render: (r: T) => React.ReactNode;
        width?: string | number;
    }[];
    getKey: (r: T) => string;
}

const depressionSeverityCode = '44261-6';
const anxietySeverityCode = '70274-6';

function prepareAllergies(allergies: AllergyIntolerance[]): OverviewCard<AllergyIntolerance> {
    return {
        title: t`Allergies`,
        icon: <ExperimentOutlined />,
        data: allergies,
        getKey: (r: AllergyIntolerance) => r.id!,
        columns: [
            {
                title: t`Name`,
                key: 'name',
                render: (r: AllergyIntolerance) => r.code?.coding?.[0]?.display,
            },
            {
                title: t`Date`,
                key: 'date',
                render: (r: AllergyIntolerance) => formatHumanDate(r.meta?.createdAt!),
                width: 200,
            },
        ],
    };
}

function prepareObservations(observations: Observation[]): OverviewCard<Observation> {
    return {
        title: t`Conditions`,
        icon: <AlertOutlined />,
        data: observations,
        getKey: (r: Observation) => r.id!,
        columns: [
            {
                title: t`Name`,
                key: 'name',
                render: (r: Observation) => r.interpretation?.[0]?.text,
            },
            {
                title: t`Date`,
                key: 'date',
                render: (r: Observation) => formatHumanDate(r.meta?.createdAt!),
                width: 200,
            },
        ],
    };
}

function prepareImmunizations(observations: Immunization[]): OverviewCard<Immunization> {
    return {
        title: t`Immunization`,
        icon: <HeartOutlined />,
        data: observations,
        getKey: (r: Immunization) => r.id!,
        columns: [
            {
                title: t`Name`,
                key: 'name',
                render: (r: Immunization) => r.vaccineCode.coding?.[0]?.display,
            },
            {
                title: t`Date`,
                key: 'date',
                render: (r: Immunization) =>
                    r.occurrence?.dateTime ? formatHumanDate(r.occurrence?.dateTime) : '',
                width: 200,
            },
        ],
    };
}

function prepareMedications(
    observations: MedicationStatement[],
): OverviewCard<MedicationStatement> {
    return {
        title: t`Active Medications`,
        icon: <img src={medicationIcon} />,
        data: observations,
        getKey: (r: MedicationStatement) => r.id!,
        columns: [
            {
                title: t`Name`,
                key: 'name',
                render: (r: MedicationStatement) =>
                    r.medication?.CodeableConcept?.coding?.[0]?.display,
            },
            {
                title: t`Dosage`,
                key: 'date',
                render: (r: MedicationStatement) =>
                    r.dosage?.[0]?.text ? r.dosage?.[0]?.text : '',
                width: 200,
            },
        ],
    };
}

function usePatientOverview(props: Props) {
    const { patient } = props;

    let details = [
        {
            title: 'Birth date',
            value: patient.birthDate
                ? `${formatHumanDate(patient.birthDate)} • ${getPersonAge(patient.birthDate)}`
                : undefined,
        },
        {
            title: 'Sex',
            value: _.upperFirst(patient.gender),
        },
        // TODO: calculate after Vitals added
        // {
        //     title: 'BMI',
        //     value: '26',
        // },
        {
            title: 'Phone number',
            value: patient.telecom?.filter(({ system }) => system === 'mobile')[0]!.value,
        },
        {
            title: 'SSN',
            value: undefined,
        },
    ];

    const [response] = useService(
        async () =>
            mapSuccess(
                await resolveMap({
                    allergiesBundle: getFHIRResources<AllergyIntolerance>('AllergyIntolerance', {
                        patient: patient.id,
                        _sort: ['-lastUpdated'],
                    }),
                    observationsBundle: getFHIRResources<Observation>('Observation', {
                        patient: patient.id,
                        _sort: ['-lastUpdated'],
                        code: [`${depressionSeverityCode},${anxietySeverityCode}`],
                    }),
                    immunizationsBundle: getFHIRResources<Immunization>('Immunization', {
                        patient: patient.id,
                        _sort: ['-lastUpdated'],
                    }),
                    medicationsBundle: getFHIRResources<MedicationStatement>(
                        'MedicationStatement',
                        {
                            patient: patient.id,
                            _sort: ['-lastUpdated'],
                        },
                    ),
                }),
                ({
                    allergiesBundle,
                    observationsBundle,
                    immunizationsBundle,
                    medicationsBundle,
                }) => {
                    const allergies = extractBundleResources(allergiesBundle).AllergyIntolerance;
                    const observations = extractBundleResources(observationsBundle).Observation;
                    const immunizations = extractBundleResources(immunizationsBundle).Immunization;
                    const medications =
                        extractBundleResources(medicationsBundle).MedicationStatement;
                    const cards = [
                        prepareObservations(observations),
                        prepareMedications(medications),
                        prepareAllergies(allergies),
                        prepareImmunizations(immunizations),
                    ];

                    return { cards: cards.filter((i) => i.data.length) };
                },
            ),
        [],
    );

    return { response, details };
}

export function PatientOverview(props: Props) {
    const { response, details } = usePatientOverview(props);

    const renderCards = (cards: OverviewCard[]) => {
        return cards.map((card) => (
            <DashboardCard title={card.title} icon={card.icon} key={`cards-${card.title}`}>
                <DashboardCardTable
                    title={card.title}
                    data={card.data}
                    columns={card.columns}
                    getKey={card.getKey}
                />
            </DashboardCard>
        ));
    };

    return (
        <div className={s.container}>
            <RenderRemoteData remoteData={response} renderLoading={Spinner}>
                {({ cards }) => {
                    const leftColCards = _.filter(
                        cards,
                        (c: OverviewCard, index: number) => index % 2 === 0,
                    ) as OverviewCard[];
                    const rightColCards = _.filter(
                        cards,
                        (c: OverviewCard, index: number) => index % 2 !== 0,
                    ) as OverviewCard[];

                    return (
                        <>
                            <DashboardCard
                                title={t`General Information`}
                                extra={<EditPatient {...props} />}
                                icon={<ContactsOutlined />}
                            >
                                <div className={s.detailsRow}>
                                    {details.map(({ title, value }, index) => (
                                        <div
                                            key={`patient-details__${index}`}
                                            className={s.detailItem}
                                        >
                                            <div className={s.detailsTitle}>{title}</div>
                                            <div className={s.detailsValue}>{value || '-'}</div>
                                        </div>
                                    ))}
                                </div>
                            </DashboardCard>
                            <div className={s.cards}>
                                <div className={s.column}>{renderCards(leftColCards)}</div>
                                <div className={s.column}>{renderCards(rightColCards)}</div>
                            </div>
                        </>
                    );
                }}
            </RenderRemoteData>
        </div>
    );
}

function EditPatient(props: Props) {
    const { patient, reload } = props;

    return (
        <ModalTrigger
            title={t`Edit patient`}
            trigger={
                <Button type="link" className={s.editButton}>
                    <Trans>Edit</Trans>
                </Button>
            }
        >
            {({ closeModal }) => (
                <QuestionnaireResponseForm
                    questionnaireLoader={questionnaireIdLoader('patient-edit')}
                    launchContextParameters={[{ name: 'Patient', resource: patient }]}
                    onSuccess={() => {
                        notification.success({
                            message: t`Patient saved`,
                        });
                        reload();
                        closeModal();
                    }}
                    onCancel={closeModal}
                />
            )}
        </ModalTrigger>
    );
}
