// @flow

import gql from 'graphql-tag';
import {
  get,
  isEmpty,
  filter,
  each,
  keys,
  size,
  difference,
  find,
  isString,
  isNumber,
  pick,
  reduce,
  isUndefined,
  isDate,
  isBoolean,
  pickBy,
} from 'lodash';

type ErrorType = {
  name: string,
  type: string,
};

export default class TypedValidator {
  type: any;
  errors: Array<ErrorType>;
  customMessages: Object;
  validatorFunctions: Object;
  validatorTypes: Object;
  definitions: Array<Object>;
  keyErrorMessage: Function;
  invalidKeys: Function;
  validate: Function;
  validateOne: Function;

  constructor(type: string, options: Object) {
    this.type = gql`${type}`;
    this.definitions = get(this.type, 'definitions');
    this.errors = [];
    this.customMessages = get(options, 'customMessages') || {};
    this.validate = this.validate.bind(this);
    this.validateOne = this.validateOne.bind(this);
    this.invalidKeys = this.invalidKeys.bind(this);
    this.keyErrorMessage = this.keyErrorMessage.bind(this);

    // Initiate all types available to this Validator
    this._bootstrapTypes(this.definitions);
  }

  /**
   * Validate the value(String) is an Email
   * @param sample
   * @returns {boolean}
   * @private
   */
  _isEmail(sample: string): boolean {
    if (!sample) {
      return false;
    }
    const regex = /^([a-zA-Z0-9_.+-])+@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return regex.test(sample);
  }

  /**
   * Validate the value(String) is a Phone Number
   * @param sample
   * @returns {boolean}
   * @private
   */
  _isTel(sample: string): boolean {
    if (!sample) {
      return false;
    }
    const stripped = sample.replace(/[^0-9]+/g, '');
    const res = (stripped.length === 10) ? 1 : 0;
    return !!res;
  }

  /**
   * Set Type Defs and Type Resolvers to the base collection
   * @param setType
   * @param setFns
   * @private
   */
  _setValidatorType(setType: Object, setFns: Object) {
    this.validatorTypes = setType;
    this.validatorFunctions = setFns;
    return;
  }

  /**
   * Add Validator Types and Functions to the Base collection of type defs/ type resolvers
   * @param addedType
   * @param addedFuncs
   * @returns {*}
   * @private
   */
  _addValidatorTypes(addedType: Object, addedFuncs: Object): void {
    const typesToAdd = Object.assign({}, this.validatorTypes, addedType);
    const funcsToAdd = Object.assign({}, this.validatorFunctions, addedFuncs);
    return this._setValidatorType(typesToAdd, funcsToAdd);
  }

  /**
   * When the Validator is instantiated, bootstrap all Type Definitions and Type Resolvers (validation functions)
   * @param definitions
   * @returns {*}
   * @private
   */
  _bootstrapTypes(definitions: Array<Object>) {
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

    each(definitions, (item: Object): void => {
      const FIELDS = item.fields;
      if (item.kind === 'ObjectTypeDefinition') {
        const namedType = item.name.value;
        return this._addValidatorTypes({
          [namedType]: this._getTypeFields(FIELDS),
        }, {
          [namedType]: (obj: Object): boolean => {
            return this.validate(obj, {
              namedType,
            });
          },
        });
      }
    });
  }

  /**
   * Transform the fields AST into a digestable type structure
   * @param fields
   * @returns {*}
   * @private
   */
  _getTypeFields(fields: Array<Object> = []): Object {
    return reduce(fields, (memo: Object, fieldObj: Object): Object => {
      const field = get(fieldObj, 'name.value');
      const type = get(fieldObj, 'type.name.value');
      const typeObj = {
        [field]: type,
      };
      return Object.assign({}, memo, typeObj);
    }, {});
  }

  /**
   * For all definitions, find the fieldType validation for a given key
   * @param key
   * @returns {*}
   * @private
   */
  _fieldTypeForValidation(key: string): Object {
    return reduce(this.definitions, (memo: Object, currentVal: Object): Object => {
      const fields = get(currentVal, 'fields');
      const fieldType = pick(this._getTypeFields(fields), [key]);
      if (fieldType) {
        return Object.assign({}, memo, fieldType);
      }
      return Object.assign({}, memo);
    }, {});
  }

  /**
   * Check if the "Document" kind is ObjectTypeDefinition
   * @param kind
   * @returns {boolean}
   * @private
   */
  _isObjectTypeDefinition(kind: string): boolean {
    return kind === 'ObjectTypeDefinition';
  }

  /**
   * Check if the "Document" kind is InputObjectTypeDefinition
   * @param kind
   * @returns {boolean}
   * @private
   */
  _isInputObjectTypeDefinition(kind: string): boolean {
    return kind === 'InputObjectTypeDefinition';
  }

  /**
   * Return this expected schema fields for ObjectTypes and InputObjectTypes
   * @param namedType
   * @returns {*}
   * @private
   */
  _expectedFieldKeys(namedType: string): Object {
    // filter schema by definition Kind
    const defintions = filter(this.definitions, (item: Object): boolean => {
      const kind = get(item, 'kind');
      if (namedType) {
        return this._isObjectTypeDefinition(kind);
      }
      return this._isInputObjectTypeDefinition(kind);
    });

    return reduce(defintions, (memo: Object, currentVal: Object): Object => {
      // get the typeFields for the fields in schema
      const fields = get(currentVal, 'fields');
      const fieldType = this._getTypeFields(fields);
      return Object.assign({}, memo, fieldType);
    }, {});
  }

  /**
   * Validate the value by its given fieldType validator function
   * @param value
   * @param fieldType
   * @returns {*}
   * @private
   */
  _validateField(value: any, fieldType: string): boolean {
    // clear errors before we validate
    this._clearErrors();
    const validationForFieldType = this.validatorFunctions[fieldType];

    if (!validationForFieldType) {
      throw new Error(`You do not have defined validator for given type. ${fieldType}`);
    }

    return validationForFieldType(value);
  }

  /**
   * Create error message for a given invalid key
   * @param key
   * @param fieldType
   * @param isRequired
   * @returns {*}
   * @private
   */
  _createErrorMessage(key: string, fieldType: Object, isRequired: boolean): string {
    const customMessage = get(this.customMessages, key);
    if (isRequired) {
      return `${key} is required`;
    }
    if (!!customMessage) {
      return customMessage;
    }

    return `${key} must be a ${get(fieldType, key)}`;
  }

  /**
   * Create error objects per invalid field
   * @param isValid
   * @param key
   * @param fieldType
   * @param required
   * @returns {Array}
   * @private
   */
  _createErrors(isValid: boolean, key: string, fieldType: Object, required: boolean = false): Array<ErrorType> {
    if (!isValid) {
      // create the error message
      const errorMessage = this._createErrorMessage(key, fieldType, required);
      this.errors.push({
        name: key,
        type: errorMessage,
      });
    }
    return this.errors;
  }

  _clearErrors() {
    this.errors = [];
  }

  /**
   * Create a SimpleSchema-esque context object. Primarily used for legacy SS implementations that are being migrated
   * @returns {TypedValidator}
   */
  newContext(): Object {
    return this;
  }

  /**
   * Validate one key in an object
   * @param obj
   * @param key
   * @returns {boolean}
   */
  validateOne(obj: Object, key: string): boolean {
    if (!key) {
      throw new Error('Must provide key to validate against');
    }

    const fieldValue = get(obj, key);

    const fieldType = this._fieldTypeForValidation(key);
    const isValid = this._validateField(fieldValue, get(fieldType, key));
    this._createErrors(isValid, key, fieldType, isUndefined(fieldValue));
    return isValid;
  }

  /**
   * Validate all keys in an object
   * @param obj
   * @param options
   * @returns {boolean}
   */
  validate(obj: Object, options: Object = {}): boolean {
    let isValid = true;

    const namedType = get(options, 'namedType');
    const expectedKeys = this._expectedFieldKeys(namedType);
    const missingKeys = difference(keys(expectedKeys), keys(obj));
    if (size(missingKeys) > 0) {
      each(missingKeys, (missingKey: string): Array<ErrorType> => {
        return this._createErrors(false, missingKey, get(expectedKeys, missingKey), true);
      });
      return false;
    }

    each(obj, (value: any, key: string): Array<ErrorType> => {
      const fieldType = this._fieldTypeForValidation(key);
      isValid = this._validateField(value, get(fieldType, key));
      return this._createErrors(isValid, key, fieldType);
    });

    return isValid;
  }

  /**
   * Grab all current invalid keys
   * @returns {Array}
   */
  invalidKeys(): Array<ErrorType> {
    return this.errors;
  }

  /**
   * Grab Error message for particular key
   * @param field
   * @returns {*}
   */
  keyErrorMessage(field: string): string {
    const message = find(this.errors, (msg: Object): boolean => {
      return get(msg, 'name') === field;
    });
    return get(message, 'type');
  }

  /**
   * Clean the object. Filter any fields not in the current schema
   * @param obj
   * @returns {*}
   */
  clean(obj: Object): Object {
    const cleanedObj = pickBy(obj, (value: any, key: string): boolean => {
      const fieldType = this._fieldTypeForValidation(key);
      if (!isEmpty(fieldType)) {
        return true;
      }
      return false;
    });

    each(obj, (value: any, key: string) => {
      if (!cleanedObj[key]) {
        delete obj[key];
      }
    });
    return obj;
  }
}
