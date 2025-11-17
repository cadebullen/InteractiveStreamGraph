import React, { Component } from "react";
import * as d3 from "d3";

class FileUpload extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedFile: null,
      parsedData: null,
    };
  }

  handleFileSubmit = (event) => {
    event.preventDefault();
    const { selectedFile } = this.state;

    if (selectedFile) {
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        const csvText = e.target.result;
        const parsedJsonData = this.csvToJson(csvText);
        this.setState({ parsedData: parsedJsonData });
        this.props.setUploadedData(parsedJsonData);
      };
      fileReader.readAsText(selectedFile);
    }
  };

  csvToJson = (csvContent) => {
    const csvLines = csvContent.split("\n").filter((line) => line.trim());
    const columnHeaders = csvLines[0].split(",").map((h) => h.trim());
    const parsedDataArray = [];
    const dateParser = d3.timeParse("%Y-%m-%d");

    for (let rowIndex = 1; rowIndex < csvLines.length; rowIndex++) {
      const csvLine = csvLines[rowIndex].trim();
      if (!csvLine) continue;

      const rowValues = csvLine.split(",").map((val) => val.trim());
      const rowObject = {};

      columnHeaders.forEach((columnName, columnIndex) => {
        const cellValue = rowValues[columnIndex];

        if (columnName === "Date") {
          rowObject[columnName] = dateParser(cellValue);
        } else if (
          ["GPT-4", "Gemini", "PaLM-2", "Claude", "LLaMA-3.1"].includes(
            columnName
          )
        ) {
          const numValue = parseFloat(cellValue);
          rowObject[columnName] = isNaN(numValue) ? 0 : numValue;
        } else {
          rowObject[columnName] = cellValue;
        }
      });

      if (
        rowObject.Date &&
        rowObject.Date instanceof Date &&
        !isNaN(rowObject.Date)
      ) {
        parsedDataArray.push(rowObject);
      }
    }

    console.log("Parsed CSV data:", parsedDataArray);
    return parsedDataArray;
  };

  render() {
    return (
      <div style={{ backgroundColor: "#f0f0f0", padding: 20 }}>
        <h2>Upload a CSV File</h2>
        <form onSubmit={this.handleFileSubmit}>
          <input
            type="file"
            accept=".csv"
            onChange={(event) =>
              this.setState({ selectedFile: event.target.files[0] })
            }
          />
          <button type="submit">Upload</button>
        </form>
      </div>
    );
  }
}

export default FileUpload;
