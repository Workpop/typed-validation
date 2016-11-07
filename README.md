# @workpop/typed-validation

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

