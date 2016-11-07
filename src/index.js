import gql from 'graphql-tag';
import { get, each, keys, size, difference, chain, isString, isNumber, pick, reduce, isDate, isBoolean, pickBy } from 'lodash';

export default class TypedValidator {
  constructor(type) {
    this.type = gql`${type}`;
    this.definitions = get(this.type, 'definitions');
    this.errors = [];
    this.validate = this.validate.bind(this);
    this.validateOne = this.validateOne.bind(this);
    this.invalidKeys = this.invalidKeys.bind(this);
    this.keyErrorMessage = this.keyErrorMessage.bind(this);

    // Initiate all types available to this Validator
    this._bootstrapTypes(this.definitions);
  }

  _isEmail(sample) {
    if (!sample) {
      return false;
    }
    const regex = /^([a-zA-Z0-9_.+-])+@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return regex.test(sample);
  }

  _isTel(sample) {
    if (!sample) {
      return false;
    }
    const stripped = sample.replace(/[^0-9]+/g, '');
    const res = (stripped.length === 10) ? 1 : 0;
    return !!res;
  }

  _setValidatorType(setType, setFns) {
    this.validatorTypes = setType;
    this.validatorFunctions = setFns;
    return;
  }

  _addValidatorTypes(addedType, addedFuncs) {
    const typesToAdd = Object.assign({}, this.validatorTypes, addedType);
    const funcsToAdd = Object.assign({}, this.validatorFunctions, addedFuncs);
    return this._setValidatorType(typesToAdd, funcsToAdd);
  }

  _bootstrapTypes(definitions) {
    this.validatorTypes = {
      string: 'String',
      int: 'Int',
      email: 'EmailType',
      boolean: 'Boolean',
      date: 'DateType',
      telephone: 'PhoneType',
    };

    this.validatorFunctions = {
      [this.validatorTypes.string]: isString,
      [this.validatorTypes.boolean]: isBoolean,
      [this.validatorTypes.int]: isNumber,
      [this.validatorTypes.email]: this._isEmail,
      [this.validatorTypes.date]: isDate,
      [this.validatorTypes.telephone]: this._isTel,
    };

    return each(definitions, (item) => {
      const FIELDS = item.fields;
      if (item.kind === 'ObjectTypeDefinition') {
        const namedType = item.name.value;
        return this._addValidatorTypes({
          [namedType]: this._getTypeFields(FIELDS),
        }, {
          [namedType]: (obj) => {
            return this.validate(obj, {
              namedType,
            });
          },
        });
      }
    });
  }

  _getTypeFields(fields = []) {
    return reduce(fields, (memo, fieldObj) => {
      const field = get(fieldObj, 'name.value');
      const type = get(fieldObj, 'type.name.value');
      const typeObj = {
        [field]: type,
      };
      return Object.assign({}, memo, typeObj);
    }, {});
  }

  _fieldTypeForValidation(key) {
    return reduce(this.definitions, (memo, currentVal) => {
      const fields = get(currentVal, 'fields');
      const fieldType = pick(this._getTypeFields(fields), key);
      if (fieldType) {
        return Object.assign({}, memo, fieldType);
      }
    }, {});
  }

  _isObjectTypeDefinition(kind) {
    return kind === 'ObjectTypeDefinition';
  }

  _isInputObjectTypeDefinition(kind) {
    return kind === 'InputObjectTypeDefinition';
  }

  _expectedFieldKeys(namedType) {
    return chain(this.definitions).filter((item) => {
      const kind = get(item, 'kind');
      if (namedType) {
        return this._isObjectTypeDefinition(kind);
      }
      return this._isInputObjectTypeDefinition(kind);
    }).reduce((memo, currentVal) => {
      const fields = get(currentVal, 'fields');
      const fieldType = this._getTypeFields(fields);
      return Object.assign({}, {}, fieldType);
    }, {}).value();
  }

  _validateField(value, fieldType) {
    const validationForFieldType = this.validatorFunctions[fieldType];

    if (!validationForFieldType) {
      throw new Error(`Do not have defined validator for given type. ${fieldType}`);
    }

    return validationForFieldType(value);
  }

  _createErrors(isValid, key, fieldType) {
    if (!isValid) {
      const errorMessage = `${key} must be a ${get(fieldType, key)}`;
      this.errors.push({
        key,
        errorMessage,
      });
    } else {
      this.errors = [];
    }
    return this.errors;
  }

  newContext() {
    return this;
  }

  validateOne(obj, key) {
    if (!key) {
      throw new Error('Must provided key to validate against');
    }

    const fieldValue = get(obj, key);

    const fieldType = this._fieldTypeForValidation(key);
    const isValid = this._validateField(fieldValue, get(fieldType, key));
    this._createErrors(isValid, key, fieldType);
    return isValid;
  }


  validate(obj, options = {}) {
    let isValid = true;

    const namedType = get(options, 'namedType');
    const expectedKeys = this._expectedFieldKeys(namedType);
    const missingKeys = difference(keys(expectedKeys), keys(obj));
    if (size(missingKeys) > 0) {
      each(missingKeys, (missingKey) => {
        this._createErrors(false, missingKey, get(expectedKeys, missingKey));
      });
      return false;
    }

    each(obj, (value, key) => {
      const fieldType = this._fieldTypeForValidation(key);
      isValid = this._validateField(value, get(fieldType, key));
      this._createErrors(isValid, key, fieldType);
    });

    return isValid;
  }

  invalidKeys() {
    return this.errors;
  }

  keyErrorMessage(field) {
    return chain(this.errors).find((msg) => {
      return get(msg, 'key') === field;
    }).get('errorMessage').value();
  }

  clean(obj) {
    const cleanedObj = pickBy(obj, (value, key) => {
      const fieldType = this._fieldTypeForValidation(key);
      if (chain(fieldType).keys().size() > 0) {
        return this._validateField(value, get(fieldType, key));
      }
    });

    each(obj, (value, key) => {
      if (!cleanedObj[key]) {
        return delete obj[key];
      }
      obj[key] = cleanedObj[key];
    });
    return obj;
  }
}
