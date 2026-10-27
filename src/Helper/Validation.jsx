import * as Yup from 'yup';
export const validationSchema = Yup.object({
  email: Yup.string().required('Email is required'),
  password: Yup.string().required('Password is required'),
});

export const validationSignup = Yup.object({
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  name: Yup.string()
    .matches(/^[A-Za-z ]*$/, 'Invalid name format')
    .required('Name is required'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  // Re-enter password validation
  confirmPassword: Yup.string()
    .required('Confirm password is required')
    .oneOf([Yup.ref('password'), null], 'Passwords must match'), // Ensure confirmPassword matches password
});
export const ForgotPasswordValidation = Yup.object({
  email: Yup.string().required('Email is required'),
});

export const PersonalDetailsValidation = Yup.object({
  firstName: Yup.string().required('First Name is required'),
  lastName: Yup.string().required('Last Name is required'),
  dob: Yup.date().required('Date Of Birth is required'),
  // contact_number: Yup.string()
  //   .matches(/^\d{10}$/, 'Contact Number should be 10 digits')
  //   .required('Contact Number is required'),
  genderLists: Yup.string().required('Gender is required'),
});

export const VerifyPassword = Yup.object({
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),

  retypePassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Please confirm your password'),
});


export const AnnouncementValidationSchema = Yup.object().shape({
  title: Yup.string()
    .trim()
    .required('Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),

  message: Yup.string()
    .trim()
    .required('Message is required')
    .min(5, 'Message must be at least 5 characters')
    .max(1000, 'Message cannot exceed 1000 characters'),

  receiver_id: Yup.string()
    .required('Please select at least one employee'),


});