import React, {useState} from "react";
import {useFormik} from "formik";
import * as yup from "yup"

function LogIn({logInUser}) {
    const [alertMessage, setAlertMessage] = useState('');
    const [alertClass, setAlertClass] = useState('postiveAlert');

    function alertReset(){
        setAlertMessage('')
    }

    function handleAlert(message, aClass){
        setAlertClass(aClass)
        setAlertMessage(message)
        setTimeout(alertReset, 2000)
    }

    const formSchema = yup.object().shape({
        username: yup.string().required("Please enter a username.").max(30),
        password: yup.string().required("Please enter a password.").max(30),
    });

    const formik = useFormik({
        validateOnChange : false,
        validateOnBlur : false,
        initialValues: {
            username: "",
            password: "",
        },
        validationSchema: formSchema,
        onSubmit: async (values) => {
            try {
                const response = await fetch('/_login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: values.username,
                        password: values.password
                    }, null, 2)
                })
                if (!response.ok) {
                    // This block will catch non-200-level HTTP responses
                    const errorData = await response.json();
                    handleAlert(errorData.error, 'negativeAlert');
                    return;
                }
                const data = await response.json();
                logInUser(data);
                formik.resetForm();
                handleAlert('Logged In!', 'positiveAlert');
                setTimeout(alertReset, 2000);
            } catch (error) {
                // This block will catch network errors and other unexpected issues
                console.error('Network Error or unexpected issue:', error);
            }
        }
    });

    return (
        <div className='signUp'>
            <h1 className='title'>Log In</h1>
            <form className='newPhotoForm' onSubmit={formik.handleSubmit}>
                <div className='left'>
                    <label>
                        Username:
                        <input type="text" id = "username" name="username" value={formik.values.username} onChange={formik.handleChange}/>
                    </label>
                    <label>
                        Password:
                        <input type="text" id = "password" name="password" value={formik.values.password} onChange={formik.handleChange}/>
                    </label>
                </div>
                <button type="submit" className='submitButton'>Submit</button>
            </form>
            {alertMessage!==''? <p className={alertClass}>{alertMessage}</p>: <></>}
        </div>
    );
}

export default LogIn;