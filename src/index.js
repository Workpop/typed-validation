import gql from 'graphql-tag';
import { get, each, isString, isNumber, pick, reduce, isDate, isBoolean } from 'lodash';

export default class TypedValidator {
  constructor(type) {
    this.type = gql`${type}`;
    this.definitions = get(this.type, 'definitions');
    this.errors = [];
    this.validate = this.validate.bind(this);
    this.isEmail = this.isEmail.bind(this);
    this.getTypes = this.getTypes.bind(this);
    this._bootstrapTypes(this.definitions);
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
    };

    this.validatorFunctions = {
      [this.validatorTypes.string]: isString,
      [this.validatorTypes.boolean]: isBoolean,
      [this.validatorTypes.int]: isNumber,
      [this.validatorTypes.email]: this.isEmail,
      [this.validatorTypes.date]: isDate,
    };

    return each(definitions, (item) => {
      const FIELDS = item.fields;
      if (item.kind === 'ObjectTypeDefinition') {
        return this._addValidatorTypes({
          [item.name.value]: this.getTypeFields(FIELDS),
        }, {
          [item.name.value]: this.validate,
        });
      }
    });
  }

  _fieldTypeForValidation(key) {
    return reduce(this.definitions, (memo, currentVal) => {
      const fields = get(currentVal, 'fields');
      const fieldType = pick(this.getTypeFields(fields), key);
      if (fieldType) {
        return Object.assign({}, memo, fieldType);
      }
    }, {});
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
      const errorMessage = `${key} must be a ${fieldType}`;
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

  getTypes() {
    return this.validatorTypes;
  }

  isEmail(sample) {
    var regex = /^([a-zA-Z0-9_.+-])+@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return regex.test(sample);
  }

  getTypeFields(fields = []) {
    return reduce(fields, (memo, fieldObj) => {
      const field = get(fieldObj, 'name.value');
      const type = get(fieldObj, 'type.name.value');
      const typeObj = {
        [field]: type,
      };
      return Object.assign({}, memo, typeObj);
    }, {});
  }

  validateOne(obj, key) {
    if (!key) {
      throw new Error('Must provided key to validate against');
    }
    const fieldType = this._fieldTypeForValidation(key);
    const isValid = this._validateField(get(obj, key), get(fieldType, key));
    this._createErrors(isValid, key, fieldType);
    return isValid;
  }


  validate(obj) {
    let isValid = true;
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
}