# @workpop/typed-validation

 A validation library backed by GraphQL Types.

## Quick Start

`npm install @workpop/typed-validation`

Define a GraphQL InputType with a template literal.

```js
const example = `
    input ExampleType {
        name: String
    }
`;
```

Create a Validator Instance.

```js
const Validator = new TypedValidator(example);
```

## Built-In Types

`TypedValidator` supports these primitive types 

`String`
`Int`
`Boolean`
`EmailType`
`DateType`
`PhoneType`

## API

### `TypedValidator`

The `TypedValidator` class is the core API and one you'll need to start validating objects against the schemas.

`constructor(type)` - Constructs an instance of TypedValidator

OPTIONS

`type` - GraphQL InputType written as a template literal.

### `validate: boolean`

`Validator.validate(obj, options);`
 This method returns true if the object is valid according to the schema or false if it is not.
 It also stores a list of invalid fields and corresponding error messages in the constructed validator

 OPTIONS

 `namedType: string` - ObjecTypeDefinition `name` for evaluating Schema structures when traversing through and a Schemas type dependencies.

### `validateOne(obj: Object, key: string): boolean`

`Validator.validateOne(obj, key).`

You may have the need to validate just one key.  
This works the same way as the validate method, except that only the specified schema key will be validated. 
This method returns true if the specified schema key is valid according to the schema or false if it is not.

### `invalidKeys`

`Validator.invalidKeys()`

To get the full array of invalid key data. Each object in the array has two keys:

`name`: The schema key as specified in the schema.
`type`: The error message 

### `keyErrorMessage`

`Validator.keyErrorMessage(field: string): string`

To get the full error message from an invalid key.

### `clean`

`Validator.clean(obj: Object): Object`

Validator instances provide a clean method that cleans or alters data in a number of ways. It's intended to be called prior to validation to avoid any avoidable validation errors.

The clean method takes the object to be cleaned as its argument and filters our properties not found in the Schema 

Additional notes:

* The object is cleaned in place. That is, the original referenced object will be cleaned. You do not have to use the return value of the clean method.
* filter removes any keys not explicitly or implicitly allowed by the schema, which prevents errors being thrown for those keys during validation.

### `newContext`

This method returns all the bound `Validator` methods. This is only needed if you are backporting this API from `SimpleSchema`


## Examples

#### Simple Example

```js
const exampleType = `
    input SampleType {
        title: String    
    }
`;

const testObject = {
    title: 'Yo!',
};

// Create a TypedValidator instance
const Validator = new TypedValidator(exampleType);

Validator.validateOne(testObject, 'title');
// true
```

#### `keyErrorMessage`

```js
const validatingTypes = `
    input ValidatingTypes {    
    num: String
    }
`;

const testObject = {
    num: 1,
};

const Validator = new TypedValidator(validatingTypes);
Validator.validate(testObject);

Validator.keyErrorMessage('num');
// num must be a String
```

#### Using ObjectTypeDefinitions

```js
const validationWithObjectTypw = `
    type User {
        id: String
        name: Int
    }

    input ValidateOneType {
        title: User    
    }
`;


const testObject = {
      title: {
        id: 'Yo!',
        name: 1,
      },
};

const Validator = new TypedValidator(validateOneType);
const isValid = Validator.validate(testObject);
// true
```