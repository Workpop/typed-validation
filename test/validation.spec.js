import { expect } from 'chai';
import TypedValidator from '../src';
import { first, isArray } from 'lodash';


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
  
  it('validateOne - Should throw key provided is not in Type', function () {
    const validateOneType = `
      input ValidateOneType {
        title: String    
      }
    `

    const testObject = {
      foobar: 'Yo!',
    }

    const Validator = new TypedValidator(validateOneType);

    expect(Validator.validateOne.bind(testObject)).to.throw();
  });

  it('validate - Should return invalid for an object with missing keys', function () {
    const validateAllType = `
      input ValidateOneType {
        title: String   
        age: Int 
      }
    `

    const testObject = {
      title: 'Yo!',
    }

    const Validator = new TypedValidator(validateAllType);

    expect(Validator.validate(testObject)).to.eql(false);
    const invalidKeys = Validator.invalidKeys();
    expect(invalidKeys.length).to.eql(1);

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
        phone: PhoneType
      }
    `

    const testObject = {
      title: 'Yo!',
      num: 1,
      email: 'abhi@workpop.com',
      subscribed: false,
      createdAt: new Date(),
      phone: '(909) 456-4319',
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
    // Phone
    expect(Validator.validateOne(testObject, 'phone')).to.eql(true);

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
    expect(isArray(invalidKeys)).to.eql(true);
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

    it('Key Error Message - should be able to retrieve error message for specific key', function () {
    const validatingTypes = `
      input ValidatingTypes {    
        num: String
      }
    `;

    let testObject = {
      num: 1,
    };

    const Validator = new TypedValidator(validatingTypes);

    Validator.validate(testObject);
  
    expect(Validator.keyErrorMessage('num')).not.to.be.undefined;
  });

  it('Clean - should clean object in place', function () {
    const validatingTypes = `
      input ValidatingTypes {    
        num: String
      }
    `;

    let testObject = {
      num: '1',
      foo: 'bar',
    };

    const Validator = new TypedValidator(validatingTypes);

    Validator.clean(testObject)

    expect(Validator.clean(testObject)).to.eql({
      num: '1',
    });
  });
});