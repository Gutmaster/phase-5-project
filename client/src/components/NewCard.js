import React, {useState, useEffect, useContext} from "react";
import {useFormik} from "formik";
import * as yup from "yup"
import UserContext from "./context/user.js"

function NewCard() {
    const [artists, setArtists] = useState([])
    const [sets, setSets] = useState([])
    const [alertMessage, setAlertMessage] = useState('')
    const [alertClass, setAlertClass] = useState('')
    const [addArtist, setAddArtist] = useState(false)
    const [addSet, setAddSet] = useState(false)
    const [newArtist, setNewArtist] = useState('')
    const [newSet, setNewSet] = useState('')
    const [date, setDate] = useState('')
    const {user} = useContext(UserContext)

    useEffect(() => {
        fetch('/artists')
        .then((r) => r.json())
        .then((json) => setArtists(json));
        fetch('/sets')
        .then((r) => r.json())
        .then((json) => setSets(json));
    }, []);

    function alertReset(){
        setAlertMessage('');
    }

    function handleAlert(message, aClass){
        setAlertClass(aClass)
        setAlertMessage(message)
        setTimeout(alertReset, 3000)
    }
    
    const formSchema = yup.object().shape({
        name: yup.string().required("Card must be named and under 30 characters.").max(30),
        art: yup.string().required("Must link an image."),
        artist: yup.string().required("Card must have an artist.").max(30),
        set: yup.string().required("Card must belong to a set.").max(30),
    })

    const formik = useFormik({
        validateOnChange: false,
        validateOnBlur: false,
        initialValues: {
            name: "",
            art: "",
            artist: "",
            set: "",
        },
        validationSchema: formSchema,
        validate: (values) => {
            const validationErrors = {};
            try {
                formSchema.validateSync(values, { abortEarly: false });
            } catch (err) {
                err.inner.forEach((error) => {
                    validationErrors[error.path] = error.message;
                });
            }
            if (Object.keys(validationErrors).length > 0) {
                setTimeout(() => {
                    formik.setErrors({});
                }, 3000);
            }
            return validationErrors;
        },
        onSubmit: async (values) => {
            try {
                const response = await fetch('/cards', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: values.name,
                        art: values.art,
                        artist: values.artist,
                        set: values.set,
                    })
                });
    
                if (!response.ok) {
                    const errorData = await response.json();
                    handleAlert(errorData.message, 'negativeAlert');
                    return;
                }
                const json = await response.json();


                user.cards = [...user.cards, json]

                const artist = user.artists.find(artist => artist.id === json.artist.id)
                if(artist)
                    artist.cards.push(json)
                else{
                    json.artist.cards = [json]
                    user.artists.push(json.artist)     
                }

                const set = user.sets.find(set => set.id === json.set.id)
                if(set)
                    set.cards.push(json)
                else{
                    json.set.cards = [json]
                    user.sets.push(json.set)     
                }

                formik.resetForm();
                handleAlert('Card added!', 'positiveAlert');
            } catch (error) {
                handleAlert(error.message, 'negativeAlert');
            }
        }
    });

    const handleArtistSubmit = async (e) => {
        try{
            e.preventDefault();
            setAddArtist(false);
            const response = await fetch('/artists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: newArtist,
                }, null, 2)
            })
            if(!response.ok) {
                // This block will catch non-200-level HTTP responses
                const errorData = await response.json()
                console.error('Validation error:', errorData)
                handleAlert(errorData.message, 'negativeAlert')
                return
            }
            const data = await response.json()
            setArtists([...artists, data])
            handleAlert('Artist Added!', 'positiveAlert');
        }catch(error) {
            handleAlert(error.message, 'negativeAlert');
        };
    }

    const handleSetSubmit = async (e) => {
        try{
            const [year, month, day] = date.split('-');
            e.preventDefault();
            setAddSet(false);
            const response = await fetch('/sets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: newSet,
                    year: year,
                    month: month,
                    day: day
                }, null, 2)
            })
            if(!response.ok) {
                // This block will catch non-200-level HTTP responses
                const errorData = await response.json()
                console.error('Validation error:', errorData)
                handleAlert(errorData.message, 'negativeAlert')
                return
            }
            const data = await response.json()
            setSets([...sets, data])
            handleAlert('Set Added!', 'positiveAlert');
        }catch(error) {
            handleAlert(error.message, 'negativeAlert');
        };
    }
      
    return (
        <div className='signUp'>
            {(!addArtist && !addSet) ? (
                <>
                    <form className='' onSubmit={formik.handleSubmit}>
                        <label htmlFor='name'>Name: </label>
                        <input 
                            type="text" 
                            id = "name" name="name" 
                            value={formik.values.name} 
                            onChange={formik.handleChange}
                            required
                        />
                        {formik.errors.name && <div>{formik.errors.name}</div>}

                        <label htmlFor='art'>Art: </label>
                        <input 
                            type="text" 
                            id = "art" name="art" 
                            value={formik.values.art} 
                            onChange={formik.handleChange}
                            required
                        />
                        {formik.errors.art && <div>{formik.errors.art}</div>}

                        <label htmlFor='artist'>Artist: </label>
                        <select 
                            id="artist" 
                            name="artist" 
                            value={formik.values.artist} 
                            onChange={formik.handleChange}
                        >
                            <option value={'select'}>Select Artist</option>
                            {artists.map((artist) => (
                                <option key={artist.id} value={artist.name}>{artist.name}</option>
                            ))}
                        </select>
                        {formik.errors.artist && <div>{formik.errors.artist}</div>}

                        <label htmlFor='set'>Set: </label>
                        <select 
                            id="set" 
                            name="set" 
                            value={formik.values.set} 
                            onChange={formik.handleChange}
                        >
                            <option value={'select'}>Select Set</option>
                            {sets.map((set) => (
                                <option key={set.id} value={set.name}>{set.name}</option>
                            ))}
                        </select>
                        {formik.errors.set && <div>{formik.errors.set}</div>}

                        <button type="submit" className='submitButton'>Submit</button>
                    </form>

                    <button onClick={() => setAddArtist(!addArtist)}>Add Artist</button>
                    <button onClick={() => setAddSet(!addSet)}>Add Set</button>
                    {alertMessage!==''? <p className={alertClass}>{alertMessage}</p>: <></>}
                </>
            ) : (
                <>
                    {addArtist ? (
                        <form onSubmit={handleArtistSubmit}>
                            <input 
                                type="text" 
                                value={newArtist} 
                                onChange={e => setNewArtist(e.target.value)} 
                                required
                            />
                            <button type="submit" className='submitButton'>Submit</button>
                            <button onClick={() => setAddArtist(!addArtist)}>Cancel</button>
                        </form>
                    ) : (
                        <></>
                    )}
    
                    {addSet ? (
                        <form onSubmit={handleSetSubmit}>
                            <div>
                                <label htmlFor="setName">Set Name:</label>
                                <input
                                    type="text"
                                    id="setName"
                                    value={newSet}
                                    onChange={e => setNewSet(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="setDate">Select Date:</label>
                                <input
                                    type="date"
                                    id="setDate"
                                    value={date}
                                    onChange={e=>setDate(e.target.value)}
                                    max={new Date().toISOString().split("T")[0]} // Today's date
                                    min="1992-01-01"
                                    required
                                />
                            </div>
                            <button type="submit" className='submitButton'>Submit</button>
                            <button type="button" onClick={() => setAddSet(!addSet)}>Cancel</button>
                        </form>
                    ) : (
                        <></>
                    )}
                </>
            )}
        </div>
    );
}

export default NewCard;