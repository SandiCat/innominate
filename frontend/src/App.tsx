import { useRef } from 'react'
import { ReactInfiniteCanvas, ReactInfiniteCanvasHandle } from 'react-infinite-canvas'
import './App.css'

function App() {
  const canvasRef = useRef<ReactInfiniteCanvasHandle>()

  return (
    <div className="h-full w-full">
      <ReactInfiniteCanvas
        ref={canvasRef}
        onCanvasMount={(mountFunc: ReactInfiniteCanvasHandle) => {
          mountFunc.fitContentToView({ scale: 1 })
        }}
      >
        {/* Example component */}
        <div className="w-64 h-64 bg-blue-500 rounded-lg p-6 text-white shadow-lg">
          <h2 className="text-xl font-bold mb-4">Draggable Component</h2>
          <p>You can:</p>
          <ul className="list-disc list-inside">
            <li>Zoom in/out</li>
            <li>Pan around</li>
            <li>Scroll to navigate</li>
          </ul>
        </div>
      </ReactInfiniteCanvas>
    </div>
  )
}

export default App
