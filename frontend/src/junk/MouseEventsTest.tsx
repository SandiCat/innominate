export function MouseEventsTest() {
  const handleParentClick = (e: React.MouseEvent) => {
    console.log("parent click", eventInfo(e));
  };

  const handleChildClick = (e: React.MouseEvent) => {
    console.log("child click", eventInfo(e));
  };

  return (
    <div className="w-[500px] h-[400px] bg-red-400" onClick={handleParentClick}>
      <div
        className="w-[100px] h-[100px] top-10 left-10 absolute bg-blue-400"
        onClick={handleChildClick}
      ></div>
    </div>
  );
}

function eventInfo(e: React.MouseEvent) {
  return { target: e.target, currentTarget: e.currentTarget };
}
