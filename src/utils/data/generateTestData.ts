// import { Device, User, DeviceRequest } from '@/types';
// import { deviceStore } from './deviceStore';
// import { userStore } from './userStore';
// import { dataStore } from '.';
//
// // Generate a random IMEI (15 digits)
// const generateIMEI = (): string => {
//   return Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join('');
// };
//
// // Generate a random serial number
// const generateSerialNumber = (prefix: string): string => {
//   const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
//   const chars = Array.from({ length: 4 }, () => letters.charAt(Math.floor(Math.random() * letters.length))).join('');
//   const numbers = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');
//   return `${prefix}-${chars}${numbers}`;
// };
//
// // Device types
// const deviceTypes = [
//   'Smartphone',
//   'Tablet',
//   'Laptop',
//   'Desktop',
//   'Smartwatch',
//   'Box',
//   'Accessory',
//   'Headset',
//   'Monitor',
//   'Printer',
//   'Other'
// ];
//
// // Smartphone brands and models
// const smartphones = [
//   { brand: 'Apple', models: ['iPhone 13', 'iPhone 14', 'iPhone 15', 'iPhone SE', 'iPhone 15 Pro Max'] },
//   { brand: 'Samsung', models: ['Galaxy S23', 'Galaxy S24', 'Galaxy Note 20', 'Galaxy A53', 'Galaxy Fold 5'] },
//   { brand: 'Google', models: ['Pixel 7', 'Pixel 8', 'Pixel 8 Pro', 'Pixel 7a', 'Pixel 6'] },
//   { brand: 'OnePlus', models: ['OnePlus 11', 'OnePlus 10T', 'OnePlus Nord', 'OnePlus 10 Pro', 'OnePlus 9'] },
//   { brand: 'Xiaomi', models: ['Mi 12', 'Redmi Note 12', 'POCO F5', 'Mi 11 Ultra', 'Redmi 10'] }
// ];
//
// // Laptop brands and models
// const laptops = [
//   { brand: 'Apple', models: ['MacBook Pro 13"', 'MacBook Pro 14"', 'MacBook Pro 16"', 'MacBook Air M2', 'MacBook Air M3'] },
//   { brand: 'Dell', models: ['XPS 13', 'XPS 15', 'Latitude 7420', 'Precision 5570', 'Inspiron 16'] },
//   { brand: 'Lenovo', models: ['ThinkPad X1 Carbon', 'ThinkPad T14s', 'Yoga 9i', 'Legion 5', 'IdeaPad Slim 7'] },
//   { brand: 'HP', models: ['Spectre x360', 'EliteBook 840', 'Envy 15', 'Pavilion 14', 'ZBook Studio'] },
//   { brand: 'Microsoft', models: ['Surface Laptop 5', 'Surface Pro 9', 'Surface Book 3', 'Surface Laptop Studio', 'Surface Go 3'] }
// ];
//
// // Tablet models
// const tablets = [
//   { brand: 'Apple', models: ['iPad Pro 12.9"', 'iPad Pro 11"', 'iPad Air', 'iPad mini', 'iPad'] },
//   { brand: 'Samsung', models: ['Galaxy Tab S8', 'Galaxy Tab S9 Ultra', 'Galaxy Tab A8', 'Galaxy Tab S7 FE', 'Galaxy Tab S9+'] },
//   { brand: 'Microsoft', models: ['Surface Pro 9', 'Surface Go 3', 'Surface Pro X', 'Surface Duo 2'] },
//   { brand: 'Lenovo', models: ['Tab P12 Pro', 'Tab M10', 'Yoga Tab 13', 'Tab P11 Pro', 'Tab M8'] }
// ];
//
// // Generate random devices
// export const generateRandomDevices = (count: number, adminId: string): Device[] => {
//   const devices: Device[] = [];
//
//   for (let i = 0; i < count; i++) {
//     // Select random device type
//     const type = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
//
//     // Generate device details based on type
//     let name = '';
//     let serialPrefix = '';
//
//     if (type === 'Smartphone') {
//       const brand = smartphones[Math.floor(Math.random() * smartphones.length)];
//       const model = brand.models[Math.floor(Math.random() * brand.models.length)];
//       name = `${brand.brand} ${model}`;
//       serialPrefix = brand.brand.substring(0, 3).toUpperCase();
//     } else if (type === 'Laptop') {
//       const brand = laptops[Math.floor(Math.random() * laptops.length)];
//       const model = brand.models[Math.floor(Math.random() * brand.models.length)];
//       name = `${brand.brand} ${model}`;
//       serialPrefix = brand.brand.substring(0, 3).toUpperCase();
//     } else if (type === 'Tablet') {
//       const brand = tablets[Math.floor(Math.random() * tablets.length)];
//       const model = brand.models[Math.floor(Math.random() * brand.models.length)];
//       name = `${brand.brand} ${model}`;
//       serialPrefix = brand.brand.substring(0, 3).toUpperCase();
//     } else {
//       // For other device types
//       const prefixes = ['PRO', 'MAX', 'ELITE', 'ULTRA', 'BASIC'];
//       const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
//       name = `${prefix} ${type} ${Math.floor(Math.random() * 1000)}`;
//       serialPrefix = prefix.substring(0, 3);
//     }
//
//     // Random status (70% available, 20% assigned, 10% missing/stolen)
//     const statusRandom = Math.random();
//     let status: 'available' | 'assigned' | 'missing' | 'stolen' = 'available';
//     let assignedTo: string | undefined = undefined;
//
//     if (statusRandom < 0.7) {
//       status = 'available';
//     } else if (statusRandom < 0.9) {
//       status = 'assigned';
//       // Will be assigned later when we have user IDs
//       assignedTo = 'pending-assignment';
//     } else if (statusRandom < 0.95) {
//       status = 'missing';
//     } else {
//       status = 'stolen';
//     }
//
//     // Create the device
//     const device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'> = {
//       name,
//       type,
//       imei: generateIMEI(),
//       serialNumber: generateSerialNumber(serialPrefix),
//       status,
//       addedBy: adminId,
//       assignedTo,
//       notes: Math.random() > 0.7 ? `Test device #${i+1}` : undefined,
//     };
//
//     devices.push(device as Device);
//   }
//
//   return devices;
// };
//
// // Generate random users
// export const generateRandomUsers = (count: number): User[] => {
//   const users: User[] = [];
//
//   const firstNames = [
//     'John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'Robert', 'Emma',
//     'James', 'Olivia', 'William', 'Sophia', 'Christopher', 'Ava', 'Daniel',
//     'Mia', 'Matthew', 'Isabella', 'Joseph', 'Charlotte', 'Andrew', 'Amelia'
//   ];
//
//   const lastNames = [
//     'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis',
//     'Garcia', 'Rodriguez', 'Wilson', 'Martinez', 'Anderson', 'Taylor',
//     'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White'
//   ];
//
//   for (let i = 0; i < count; i++) {
//     const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
//     const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
//     const id = `user-${Date.now()}-${i}`;
//
//     // Create the user
//     const user: User = {
//       id,
//       name: `${firstName} ${lastName}`,
//       firstName,
//       lastName,
//       email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@tecace.com`,
//       role: Math.random() < 0.8 ? 'user' : 'manager', // 80% regular users, 20% managers
//       avatarUrl: `https://api.dicebear.com/7.x/personas/svg?seed=${firstName}${lastName}`
//     };
//
//     users.push(user);
//   }
//
//   return users;
// };
//
// // Populate the database with test data
// export const populateTestData = (): boolean => {
//   try {
//     console.info('Generating test data...');
//
//     // Check if we already have sufficient data
//     const existingDevices = dataStore.getDevices();
//     const existingUsers = dataStore.getUsers();
//
//     if (existingDevices.length >= 30 && existingUsers.length >= 5) {
//       console.info('Already have sufficient test data');
//       return false;
//     }
//
//     // Add test users first
//     const testUsers = dataStore.addTestUsers();
//     console.info(`Added ${testUsers.length} test users`);
//
//     // Continue with existing device generation code
//     const newDevices = generateRandomDevices(30, 'admin-1');
//
//     // Add devices to store
//     newDevices.forEach(device => {
//       // Check if any devices need to be assigned to random users
//       if (device.assignedTo === 'pending-assignment') {
//         // Assign to a random user
//         const randomUserIndex = Math.floor(Math.random() * testUsers.length);
//         device.assignedTo = testUsers[randomUserIndex].id;
//       }
//
//       // Add the device
//       deviceStore.addDevice({
//         name: device.name,
//         type: device.type,
//         imei: device.imei,
//         serialNumber: device.serialNumber,
//         status: device.status,
//         addedBy: device.addedBy,
//         assignedTo: device.assignedTo,
//         notes: device.notes
//       });
//     });
//
//     console.log(`Added ${newDevices.length} test devices`);
//     return true;
//   } catch (error) {
//     console.error('Error generating test data:', error);
//     return false;
//   }
// };
