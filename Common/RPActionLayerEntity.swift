//
//  RPActionLayer.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 17.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class RPActionLayerEntity: RPLayerEntity {
    
    var patternControllerComponent: RPPatternControllerComponent {
        
        guard let patternControllerComponent = self.componentForClass(RPPatternControllerComponent) else { fatalError() }
        return patternControllerComponent
    }
    
    /*
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
        print("ACTION: \(parallaxFactor) Position: \(renderComponent.node.position.y)")
    }*/
}
