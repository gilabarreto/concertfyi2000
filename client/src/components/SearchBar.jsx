import React, { useEffect, useCallback } from "react"
import useDebounce from "../hooks/useDebounce"
import { useNavigate, useParams } from "react-router-dom"
import { getSetlist, getTicketmaster } from "../api/api"

export default function SearchBar(props) {
  const { value, setValue, setSetlist, setTicketmaster } = props
  const navigate = useNavigate()
  const { artistId } = useParams()

  const handleChange = (event) => {
    if (artistId) {
      navigate("/search")
    }
    setValue(event.target.value)
  }

  const term = useDebounce(value, 700)

  const fetchData = useCallback(() => {
    console.log("🔍 Buscando dados para:", value)

    Promise.all([
      getSetlist(value),
      getTicketmaster(value)
    ])
      .then(([setlistResponse, ticketmasterResponse]) => {
        const setlists = setlistResponse.data.setlist || []
        const ticketmasterData = ticketmasterResponse.data._embedded || {}

        console.log("🎵 Setlist API response:", setlists)
        console.log("🎫 Ticketmaster API response:", ticketmasterData)

        setSetlist(setlists)
        setTicketmaster(ticketmasterData)
      })
      .catch((err) => {
        console.error("Erro ao buscar dados:", err)
      })
  }, [value, setSetlist, setTicketmaster])

  useEffect(() => {
    if (!term || term.length === 0) return
    fetchData()
  }, [term, fetchData])

  return (
    <div className="search">
      <form className="input-container" onSubmit={(event) => event.preventDefault()}>
        <input
          className="input-text-search"
          type="search"
          value={value}
          placeholder="Search"
          onChange={handleChange}
        />
      </form>
    </div>
  )
}
