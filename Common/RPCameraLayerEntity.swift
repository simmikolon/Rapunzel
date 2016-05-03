//
//  RPCameraLayer.swift
//  Rapunzel
//
//  Created by Simon Kemper on 31.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class RPCameraLayerEntity: RPLayerEntity {

    let cameraComponent: RPCameraComponent
    
    init(withParallaxFactor factor: CGFloat = 1.0, focusedNode node: RPNode) {
        cameraComponent = RPCameraComponent(focusedNode: node)
        super.init(withParallaxFactor: factor, cameraComponent: cameraComponent)
        addComponent(cameraComponent)
        self.renderComponent.addChild(cameraComponent.cameraNode)
        self.name = "RPCameraLayerEntity"
    }
    
    /*
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
        print("CAMERA: \(parallaxFactor) Position: \(renderComponent.node.position.y)")
    }*/
}
