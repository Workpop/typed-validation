import { expect } from 'chai';
import TypedValidator from '../src';
import { first } from 'lodash';


describe('Tests', function () {
  it('validateOne - Should validate one key from value', function () {
    const validateOneType = `
      input ValidateOneType {
        title: String    
      }
    `

    const testObject = {
      title: 'Yo!',
    }

    const Validator = new TypedValidator(validateOneType);

    const isValid = Validator.validateOne(testObject, 'title');

    expect(isValid).to.eql(true);
  });

  it('validateOne - Should throw if no key provided', function () {
    const validateOneType = `
      input ValidateOneType {
        title: String    
      }
    `

    const testObject = {
      title: 'Yo!',
    }

    const Validator = new TypedValidator(validateOneType);

    expect(Validator.validateOne.bind(testObject)).to.throw();
  });

  it('validate - Object Type', function () {
    const validateOneType = `
      type User {
        id: String
        name: Int
      }

      input ValidateOneType {
        title: User    
      }
    `

    const testObject = {
      title: {
        id: 'Yo!',
        name: 1,
      },
    }

    const Validator = new TypedValidator(validateOneType);

    const isValid = Validator.validate(testObject);

    expect(isValid).to.eql(true);
  });

  it('validation types - Should validate each built-in type', function () {
    const validatingTypes = `
      input ValidatingTypes {
        title: String    
        num: Int
        email: EmailType
        subscribed: Boolean
        createdAt: DateType
      }
    `

    const testObject = {
      title: 'Yo!',
      num: 1,
      email: 'abhi@workpop.com',
      subscribed: false,
      createdAt: new Date(),
    }

    const Validator = new TypedValidator(validatingTypes);

    // String
    expect(Validator.validateOne(testObject, 'title')).to.eql(true);
    // Number
    expect(Validator.validateOne(testObject, 'num')).to.eql(true);
    // Email
    expect(Validator.validateOne(testObject, 'num')).to.eql(true);
    // Boolean
    expect(Validator.validateOne(testObject, 'subscribed')).to.eql(true);
    // Date
    expect(Validator.validateOne(testObject, 'createdAt')).to.eql(true);

  });

  it('InvalidKeys - should show an Array invalid keys', function () {
    const validatingTypes = `
      input ValidatingTypes {    
        num: String
      }
    `

    const testObject = {
      num: 1,
    }

    const Validator = new TypedValidator(validatingTypes);

    // should be invalid
    expect(Validator.validate(testObject)).to.eql(false);
    const invalidKeys = Validator.invalidKeys();
    expect(first(invalidKeys).key).to.eql('num');
    expect(invalidKeys.length).to.eql(1);
  });

  it('InvalidKeys - should be empty after a validation is successful', function () {
    const validatingTypes = `
      input ValidatingTypes {    
        num: String
      }
    `;

    const testObject = {
      num: 1,
    };

    const correctType = {
      num: '1'
    };

    const Validator = new TypedValidator(validatingTypes);

    // should be invalid
    expect(Validator.validate(testObject)).to.eql(false);
    let invalidKeys = Validator.invalidKeys();
    expect(first(invalidKeys).key).to.eql('num');
    expect(invalidKeys.length).to.eql(1);
    expect(Validator.validate(correctType)).to.eql(true);
    invalidKeys = Validator.invalidKeys();
    expect(invalidKeys.length).to.eql(0);
  });

});