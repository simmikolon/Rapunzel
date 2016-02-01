//
//  RPParallaxScrollingComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 26.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import UIKit
import GameplayKit
import SpriteKit

class RPParallaxScrollingComponent: GKComponent {

    weak var layerEntity: RPLayerEntity?
    weak var cameraNode: SKNode?
    
    init(withLayerEntity layerEntity: RPLayerEntity, cameraNode: SKNode) {
        
        self.layerEntity = layerEntity
        self.cameraNode = cameraNode
        super.init()
    }
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        
        let absoluteCameraPosition = cameraNode!.scene?.convertPoint(cameraNode!.position, fromNode: cameraNode!.parent!)
        let factor = RPWorldNodeSettings.SmoothingFactor + layerEntity!.parallaxFactor
        
        let x = layerEntity!.renderComponent.node.position.x - (absoluteCameraPosition!.x / factor)
        let y = layerEntity!.renderComponent.node.position.y - (absoluteCameraPosition!.y / factor)

        layerEntity!.renderComponent.node.position = CGPoint(x: x, y: y)
    }
}
