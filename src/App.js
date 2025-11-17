import React, { Component } from "react";
import "./App.css";
import FileUpload from "./FileUpload";
import InteractiveStreamGraph from "./InteractiveStreamGraph";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      csvData: [],
    };
  }

  setUploadedData = (parsedCsvData) => {
    this.setState({ csvData: parsedCsvData });
  };

  render() {
    return (
      <div>
        <FileUpload setUploadedData={this.setUploadedData} />

        <div className="parent">
          <InteractiveStreamGraph csvData={this.state.csvData} />
        </div>
      </div>
    );
  }
}

export default App;
