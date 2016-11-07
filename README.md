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

## API

### TypedValidator
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


## Examples

1. Simple Example

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

