import React from 'react';
import mortgageTranslations from '../../assets/mortgage-translations.json';
import DatePicker, { MinimalEvent } from '../DatePicker';

export interface Guarantor {
  name: string;
  dateOfBirth: string;
  responsibilities: string;
  incomes: string;
  maritalStatus: string;
  employmentStatus: string;
  dependents: string;
}

interface GuarantorCardProps {
  index: number;
  person: Guarantor;
  getValidationClass: (fieldName: string) => string;
  onChange: (
    field: keyof Guarantor,
    value: string,
    event?: MinimalEvent | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  onRemove?: () => void;
  showRemove?: boolean;
  lang?: 'en' | 'pt';
}

const GuarantorCard: React.FC<GuarantorCardProps> = ({ index, person, getValidationClass, onChange, onRemove, showRemove, lang: langProp }) => {
  const selLangRaw = langProp ?? navigator.language;
  const lang = (typeof selLangRaw === 'string' && selLangRaw.toLowerCase().startsWith('pt')) ? 'pt' : 'en';
  const t = mortgageTranslations[lang];
  return (
    <div className="card card-plain border mb-4" style={{ borderRadius: '0.75rem', backgroundColor: '#fff3e0' }}>
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="font-weight-bold text-dark mb-0">{t.cards.guarantor.title} {index + 1}</h6>
          {showRemove && (
            <button type="button" className="btn btn-outline-warning btn-sm" onClick={onRemove} style={{ borderRadius: '0.5rem' }}>
              <i className="material-icons" style={{ fontSize: '16px', verticalAlign: 'middle' }}>delete</i>
              {t.cards.guarantor.remove}
            </button>
          )}
        </div>

        {/* Basic Information Row */}
        <div className="row">
          <div className="col-md-4">
            <div className={`input-group input-group-dynamic mb-4 ${person.name ? 'is-filled' : ''}`}>
              <label className="form-label">{t.labels.fullName}</label>
              <input
                className={`form-control ${getValidationClass(`guarantor-${index}-name`)}`}
                value={person.name}
                onChange={e => onChange('name', e.target.value, e)}
                aria-label="Name..."
                type="text"
              />
            </div>
          </div>
          <div className="col-md-4">
            <DatePicker
              value={person.dateOfBirth}
              placeholder={t.labels.dateOfBirth}
              onChange={(value, event) => onChange('dateOfBirth', value, event)}
              validationClass={getValidationClass(`guarantor-${index}-dateOfBirth`)}
            />
          </div>
          <div className="col-md-4">
            <div className={`input-group input-group-dynamic mb-4 ${person.maritalStatus && person.maritalStatus !== '' ? 'is-filled' : ''}`}>
              <label className="form-label">{t.labels.maritalStatus}</label>
              <select
                className={`form-control ${getValidationClass(`guarantor-${index}-maritalStatus`)}`}
                value={person.maritalStatus}
                onChange={e => onChange('maritalStatus', e.target.value, e)}
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/ %3e%3c/svg%3e")',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem',
                  appearance: 'none',
                  border: 'none',
                  borderBottom: '1px solid #d2d6da',
                  borderRadius: '0',
                  backgroundColor: 'transparent',
                }}
              >
                <option value=""></option>
                <option value="single">{t.options.maritalStatus.single}</option>
                <option value="married">{t.options.maritalStatus.married}</option>
                <option value="divorced">{t.options.maritalStatus.divorced}</option>
                <option value="widowed">{t.options.maritalStatus.widowed}</option>
                <option value="separated">{t.options.maritalStatus.separated}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Employment and Financial Row */}
        <div className="row">
          <div className="col-md-3">
            <div className={`input-group input-group-dynamic mb-4 ${person.employmentStatus && person.employmentStatus !== '' ? 'is-filled' : ''}`}>
              <label className="form-label">{t.labels.employmentStatus}</label>
              <select
                className={`form-control ${getValidationClass(`guarantor-${index}-employmentStatus`)}`}
                value={person.employmentStatus}
                onChange={e => onChange('employmentStatus', e.target.value, e)}
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/ %3e%3c/svg%3e")',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem',
                  appearance: 'none',
                  border: 'none',
                  borderBottom: '1px solid #d2d6da',
                  borderRadius: '0',
                  backgroundColor: 'transparent',
                }}
              >
                <option value=""></option>
                <option value="employed_full_time">{t.options.employmentStatus.employed_full_time}</option>
                <option value="employed_part_time">{t.options.employmentStatus.employed_part_time}</option>
                <option value="self_employed">{t.options.employmentStatus.self_employed}</option>
                <option value="unemployed">{t.options.employmentStatus.unemployed}</option>
                <option value="retired">{t.options.employmentStatus.retired}</option>
                <option value="student">{t.options.employmentStatus.student}</option>
              </select>
            </div>
          </div>
          <div className="col-md-3">
            <div className={`input-group input-group-dynamic mb-4 ${person.responsibilities ? 'is-filled' : ''}`}>
              <label className="form-label">{t.labels.responsibilities}</label>
              <input
                className={`form-control ${getValidationClass(`guarantor-${index}-responsibilities`)}`}
                value={person.responsibilities}
                onChange={e => onChange('responsibilities', e.target.value, e)}
                aria-label="Responsibilities..."
                type="text"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title={t.labels.responsibilitiesTooltip}
              />
            </div>
          </div>
          <div className="col-md-3">
            <div className={`input-group input-group-dynamic mb-4 ${person.incomes ? 'is-filled' : ''}`}>
              <label className="form-label">{t.labels.incomes}</label>
              <input
                className={`form-control ${getValidationClass(`guarantor-${index}-incomes`)}`}
                value={person.incomes}
                onChange={e => onChange('incomes', e.target.value, e)}
                aria-label="Incomes..."
                type="text"
              />
            </div>
          </div>
          <div className="col-md-3">
            <div className={`input-group input-group-dynamic mb-4 ${person.dependents ? 'is-filled' : ''}`}>
              <label className="form-label">{t.labels.dependents}</label>
              <input
                className={`form-control ${getValidationClass(`guarantor-${index}-dependents`)}`}
                value={person.dependents}
                onChange={e => onChange('dependents', e.target.value.replace(/[^0-9]/g, ''), e)}
                aria-label="Dependents..."
                type="text"
                inputMode="numeric"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuarantorCard;
