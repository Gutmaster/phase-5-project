import React, {useState, useEffect} from 'react'
import Card from "./Card.js"


function Library({artists, sets}) {
    const [library, setLibrary] = useState([])
    const [filteredCards, setFilteredCards] = useState([])
    const [artistFilter, setArtistFilter] = useState('select')
    const [setFilter, setSetFilter] = useState('select')

    useEffect(() => {
        fetch("/_library")
        .then((r) => r.json())
        .then(json => {
            setLibrary(json)
            setFilteredCards(json)
        })
    }, [])

    useEffect(() => {
        filterCards()
    }, [artistFilter, setFilter])

    function filterCards() {
        let filtered = []
        let selectedArtist = artists.find(artist => artist.id === parseInt(artistFilter))
        let selectedSet = sets.find(set => set.id === parseInt(setFilter))
        if(artistFilter !== 'select'){
            filtered = selectedArtist.cards
            if(setFilter !== 'select')
            filtered = filtered.filter(card => card.set.name === selectedSet.name)
        }
        else if(setFilter !== 'select')
            filtered = selectedSet.cards
        else
            filtered = library
        setFilteredCards(filtered)
    }

    return (
        <div className='animals'>
            <label htmlFor='artist'>Artist: </label>
            <select id="artist" name="artist" value={artistFilter} onChange={e=>setArtistFilter(e.target.value)}>
                <option value={'select'}>Select Artist</option>
                {artists.map((artist) => (
                    <option key={artist.id} value={artist.id}>{artist.name}</option>
                ))}
            </select>
            <label htmlFor='set'>Set: </label>
            <select id="set" name="set" value={setFilter} onChange={e=>setSetFilter(e.target.value)}>
                <option value={'select'}>Select Set</option>
                {sets.map((set) => (
                    <option key={set.id} value={set.id}>{set.name}</option>
                ))}
            </select>
            <section className="container">
            {filteredCards.map((card) => (
                <Card key = {card.id} card = {card}/>
            ))}
            </section>
        </div>
        );
    }

    export default Library
