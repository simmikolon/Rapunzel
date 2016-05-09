//
//  RPOperationQueueComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 09.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class RPOperationQueueComponent: GKComponent {

    let operationQueue: NSOperationQueue
    
    init(withNumberOfConcurrentOperations numberOfConcurrentOperations: Int) {
        
        operationQueue = NSOperationQueue()
        operationQueue.maxConcurrentOperationCount = numberOfConcurrentOperations
    }
}
