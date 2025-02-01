import swaggerJsdoc from 'swagger-jsdoc';
import YAML from 'yamljs';
import path from 'path';

// Load the external swagger.yaml file
const swaggerDocument = YAML.load(path.join(__dirname, '../../apps/request-documentation/api/swagger.yaml'));

// Swagger configuration with only the YAML contract
const options = {
  definition: swaggerDocument,
  apis: [], // Empty array to satisfy swagger-jsdoc requirement
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
